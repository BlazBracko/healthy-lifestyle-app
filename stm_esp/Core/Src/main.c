/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2025 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "usb_device.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include "usbd_cdc_if.h"
#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include <stddef.h>
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */
/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/

TIM_HandleTypeDef htim2;

UART_HandleTypeDef huart3;


/* USER CODE BEGIN PV */


/*static const char http_hello[] =
"HTTP/1.1 200 OK\r\n"
"Content-Type: text/html\r\n"
"Connection: close\r\n"
"Content-Length: 46\r\n"
"\r\n"
"<!DOCTYPE html><html><body>Hello</body></html>";*/

//char wifi_ssid[64] = "Stan6";
//char wifi_pass[64] = "stanovanje6";
char wifi_ssid[64] = "iPhones";
char wifi_pass[64] = "picimiki123456";
//char wifi_ssid[64] = "iPhone";
//char wifi_pass[64] = "klobasa4444";
uint8_t done = 0;
uint8_t server_started = 0;
uint8_t wifi_reconfig = 0;   // NEW flag

#define ESP_RX_SZ 4096
static uint8_t  esp_rx[ESP_RX_SZ];
static uint32_t esp_rx_len = 0;

volatile uint8_t esp_got_prompt = 0;
volatile uint8_t esp_send_ok    = 0;
volatile uint8_t esp_error      = 0;

static uint8_t rx_byte;

volatile uint8_t  send_tick_50ms = 0;
volatile uint8_t ms_cnt  = 0;

volatile uint8_t esp_busy = 0;
volatile uint8_t link_ok = 0;


volatile uint8_t  post_blocked = 0;
volatile uint32_t post_block_until_ms = 0;

#define POST_BLOCK_MS 800

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_I2C1_Init(void);
static void MX_SPI1_Init(void);
static void MX_USART3_UART_Init(void);
static void MX_TIM2_Init(void);
/* USER CODE BEGIN PFP */



//static bool ESP_SendHTTP(int conn_id, const char *page);


void BlockPosting(uint32_t ms);
uint8_t PostingAllowed(void);
void parse_query_kv(char *query);
/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */


//------------------------------------------------------------

void CDC_Print(const char *s)
{
  while (CDC_Transmit_FS((uint8_t*)s, strlen(s)) == USBD_BUSY) {}
}

//------------------------------------------------------------

void ESP_ClearRx(void){
	esp_rx_len = 0;
	esp_rx[0] = 0;
}



static bool ESP_SendCmd_Wait(UART_HandleTypeDef *huart,const char *cmd,const char *ok_str, const char *err_str,uint32_t timeout_ms,
                            uint8_t *resp_out, uint32_t resp_out_sz,uint32_t *resp_len_out)
{
    if (resp_len_out) *resp_len_out = 0;

    ESP_ClearRx();  // <-- FLUSH before every command

    // send "cmd\r\n"
    char line[256];
    snprintf(line, sizeof(line), "%s\r\n", cmd);
    HAL_UART_Transmit(huart, (uint8_t*)line, strlen(line), 1000);

    uint32_t t0 = HAL_GetTick();

    while ((HAL_GetTick() - t0) < timeout_ms)
    {
        // buffer is already null-terminated in ISR, but keep safe
        uint32_t len = esp_rx_len;
        if (len >= ESP_RX_SZ) len = ESP_RX_SZ - 1;
        esp_rx[len] = 0;

        if (ok_str && strstr((char*)esp_rx, ok_str))
            goto done_ok;

        if (err_str && strstr((char*)esp_rx, err_str))
            goto done_err;

        HAL_Delay(1);
    }

done_err:
    // copy response (optional)
    if (resp_out && resp_out_sz)
    {
        uint32_t cpy = (esp_rx_len < resp_out_sz - 1) ? esp_rx_len : (resp_out_sz - 1);
        memcpy(resp_out, esp_rx, cpy);
        resp_out[cpy] = 0;
        if (resp_len_out) *resp_len_out = cpy;
    }
    return false;

done_ok:
    if (resp_out && resp_out_sz)
    {
        uint32_t cpy = (esp_rx_len < resp_out_sz - 1) ? esp_rx_len : (resp_out_sz - 1);
        memcpy(resp_out, esp_rx, cpy);
        resp_out[cpy] = 0;
        if (resp_len_out) *resp_len_out = cpy;
    }
    return true;
}

// ====== ESP init sequence ======

typedef enum {
		ESP_INIT_OK = 0,
		ESP_INIT_NO_AT,
		ESP_INIT_WIFI_MODE_FAIL,
		ESP_INIT_JOIN_FAIL,
		ESP_INIT_NO_IP
	} esp_init_status_t;

	void ESP_RxStart(void)
	{
	    ESP_ClearRx();
	    HAL_UART_Receive_IT(&huart3, &rx_byte, 1);
	}

	esp_init_status_t ESP_Init(const char *ssid, const char *pass)
	{
	    uint8_t  resp[512];
	    uint32_t rlen;

	    // 1) AT check (retry a few times)
	    for (int attempt = 0; attempt < 5; attempt++)
	    {
	        if (ESP_SendCmd_Wait(&huart3, "AT", "OK", "ERROR", 500, resp, sizeof(resp), &rlen))
	            goto at_ok;

	        HAL_Delay(200);
	    }
	    return ESP_INIT_NO_AT;

	at_ok:
	    // 2) Echo off (optional)
	    ESP_SendCmd_Wait(&huart3, "ATE0", "OK", "ERROR", 500, resp, sizeof(resp), &rlen);

	    // 3) Station mode
	    if (!ESP_SendCmd_Wait(&huart3, "AT+CWMODE=1", "OK", "ERROR", 1000, resp, sizeof(resp), &rlen))
	        return ESP_INIT_WIFI_MODE_FAIL;

	    // 4) Join AP
	    char join_cmd[256];
	    snprintf(join_cmd, sizeof(join_cmd), "AT+CWJAP=\"%s\",\"%s\"", ssid, pass);

	    if (!ESP_SendCmd_Wait(&huart3, join_cmd, "OK", "FAIL", 15000, resp, sizeof(resp), &rlen))
	        return ESP_INIT_JOIN_FAIL;

	    // 5) Confirm IP
	    if (!ESP_SendCmd_Wait(&huart3, "AT+CIFSR", "STAIP", "ERROR", 3000, resp, sizeof(resp), &rlen))
	        return ESP_INIT_NO_IP;

	    return ESP_INIT_OK;
	}

	static bool ESP_GetAndPrintIP(void)
	{
	    // Send command (and flush)
	    ESP_ClearRx();
	    HAL_UART_Transmit(&huart3, (uint8_t*)"AT+CIFSR\r\n", 10, 1000);

	    uint32_t t0 = HAL_GetTick();
	    while ((HAL_GetTick() - t0) < 3000)
	    {
	        // make sure it's terminated
	        uint32_t len = esp_rx_len;
	        if (len >= ESP_RX_SZ) len = ESP_RX_SZ - 1;
	        esp_rx[len] = 0;

	        // find STAIP,"
	        char *p = strstr((char*)esp_rx, "STAIP,\"");
	        if (p)
	        {
	            p += strlen("STAIP,\"");

	            // find closing quote after IP
	            char *q = strchr(p, '"');
	            if (q && q > p)
	            {
	                char ip[32];
	                int n = (int)(q - p);
	                if (n > (int)sizeof(ip) - 1) n = sizeof(ip) - 1;

	                memcpy(ip, p, n);
	                ip[n] = 0;

	                CDC_Print(ip);
	                CDC_Print("\r\n");   // use CRLF, not \n\r
	                return true;
	            }
	        }

	        HAL_Delay(1);
	    }

	    CDC_Print("ESP IP not available yet\r\n");
	    return false;
	}

void ESP_StartWebServer(void)
{
    uint8_t resp[256];
    uint32_t rlen;

    CDC_Print("Starting web server...\r\n");

    // ---- FORCE ACTIVE RECEIVE MODE (IMPORTANT) ----
    ESP_SendCmd_Wait(&huart3, "AT+CIPMODE=0",     "OK", "ERROR", 1000, resp, sizeof(resp), &rlen);
    ESP_SendCmd_Wait(&huart3, "AT+CIPRECVMODE=0", "OK", "ERROR", 1000, resp, sizeof(resp), &rlen);
    ESP_SendCmd_Wait(&huart3, "AT+CIPDINFO=1",    "OK", "ERROR", 1000, resp, sizeof(resp), &rlen);
    ESP_SendCmd_Wait(&huart3, "AT+CIPSTO=60",     "OK", "ERROR", 1000, resp, sizeof(resp), &rlen);

    // Disable server if it was already running (safe reset)
    ESP_SendCmd_Wait(&huart3, "AT+CIPSERVER=0", "OK", "ERROR", 1000, resp, sizeof(resp), &rlen);

    // Enable multiple connections
    ESP_SendCmd_Wait(&huart3, "AT+CIPMUX=1", "OK", "ERROR", 1000, resp, sizeof(resp), &rlen);

    // Start server on port 80
    ESP_SendCmd_Wait(&huart3, "AT+CIPSERVER=1,80", "OK", "ERROR", 1000, resp, sizeof(resp), &rlen);

    CDC_Print("Web server running on port 80\r\n");
}

//test OK response AT
/*bool ESP_SendAT_OK(UART_HandleTypeDef *huart, uint32_t timeout_ms)
{
    // Clear RX buffer/state
    ESP_ClearRx();

    // Send plain "AT"
    const char at_cmd[] = "AT\r\n";
    HAL_UART_Transmit(huart, (uint8_t*)at_cmd, sizeof(at_cmd) - 1, 1000);

    uint32_t t0 = HAL_GetTick();

    // Wait until "OK" is seen in rx buffer (or timeout)
    while ((HAL_GetTick() - t0) < timeout_ms)
    {
        // Ensure null-terminated so strstr is safe
        uint32_t len = esp_rx_len;
        if (len >= (ESP_RX_SZ - 1)) len = ESP_RX_SZ - 1;
        esp_rx[len] = 0;

        if (strstr((char*)esp_rx, "OK") != NULL)
            return true;

        HAL_Delay(1);
    }

    return false; // timeout
}*/

void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart == &huart3)
    {
        if (esp_rx_len < (ESP_RX_SZ - 1))
        {
            esp_rx[esp_rx_len++] = rx_byte;
            esp_rx[esp_rx_len] = 0; // keep it a C-string
        }
        // else: buffer full, you can ignore new bytes or wrap

        HAL_UART_Receive_IT(&huart3, &rx_byte, 1);
    }
}

static bool ESP_WaitFor(const char *needle, uint32_t timeout_ms)
{
    uint32_t t0 = HAL_GetTick();
    while ((HAL_GetTick() - t0) < timeout_ms)
    {
        if (strstr((char*)esp_rx, needle)) return true;
        HAL_Delay(1);
    }
    return false;
}

static bool ESP_SendData(uint8_t cid, const char *data)
{

	if (strstr((char*)esp_rx, "+IPD,")) {
	    // let ESP_Pump() consume it first
	    return false;
	}

    char cmd[64];
    int len = (int)strlen(data);

    // IMPORTANT: clear before command so '>'/'SEND OK' are fresh
    ESP_ClearRx();
    snprintf(cmd, sizeof(cmd), "AT+CIPSEND=%u,%d", (unsigned)cid, len);

    // send AT+CIPSEND...
    {
        char line[96];
        snprintf(line, sizeof(line), "%s\r\n", cmd);
        HAL_UART_Transmit(&huart3, (uint8_t*)line, strlen(line), 1000);
    }

    // wait for prompt
    if (!ESP_WaitFor(">", 2000))
    {
        CDC_Print("NO >, RX was:\r\n");
        CDC_Print((char*)esp_rx);
        CDC_Print("\r\n");
        return false;
    }

    // now send the raw HTTP bytes
    ESP_ClearRx();
    HAL_UART_Transmit(&huart3, (uint8_t*)data, len, 2000);

    // wait for SEND OK
    if (!ESP_WaitFor("SEND OK", 3000))
        return false;

    return true;
}

void ESP_Pump(void)
{
    // Look for +IPD,<id>,
    char *p = strstr((char*)esp_rx, "+IPD,");
    if (!p) return;

    // Parse connection ID: +IPD,<id>,<len>:...
    int cid = -1;
    if (sscanf(p, "+IPD,%d,", &cid) != 1) {
        ESP_ClearRx();
        return;
    }

    if (cid >= 0 && cid <= 3) {
        // any web traffic -> block posting for a short time
        BlockPosting(POST_BLOCK_MS);
    }

    if (cid == 4) {
            // This is the response to our outgoing POST; do NOT close it here.
            // Optionally print it:
            //CDC_Print("CLIENT RX:\r\n"); CDC_Print(p); CDC_Print("\r\n");
            ESP_ClearRx();
            return;
        }
    // ---------- 1) Handle SUBMIT: GET /set?ssid=...&pass=... ----------
    if (strstr(p, "GET /set?") != NULL)
    {
        // DEBUG: show the request chunk we have
        CDC_Print("REQ:\r\n");
        CDC_Print(p);
        CDC_Print("\r\n");

        // URL looks like: GET /set?ssid=AAA&pass=BBB HTTP/1.1
        char *qs = strstr(p, "GET /set?");
        qs += strlen("GET /set?");

        // Find end of URL: prefer " HTTP/" (robust), fallback to space
        char *end = strstr(qs, " HTTP/");
        if (!end) end = strchr(qs, ' ');

        if (!end)
        {
            CDC_Print("PARSE: no end marker yet\r\n");
            // Do NOT clear rx here; wait for more data next ESP_Pump() call
            return;
        }

        char query[256];
        int n = (int)(end - qs);
        if (n < 0) n = 0;
        if (n > (int)sizeof(query) - 1) n = sizeof(query) - 1;
        memcpy(query, qs, n);
        query[n] = 0;

        CDC_Print("QUERY:\r\n");
        CDC_Print(query);
        CDC_Print("\r\n");

        parse_query_kv(query);

        CDC_Print("NEW SSID: "); CDC_Print(wifi_ssid); CDC_Print("\r\n");
        CDC_Print("NEW PASS: "); CDC_Print(wifi_pass); CDC_Print("\r\n");

        wifi_reconfig = 1;
        server_started = 0;

        // Reply "Saved"
        const char *body =
            "<!DOCTYPE html><html><body>"
            "<h2>Saved</h2>"
            "<p>Reconnecting...</p>"
            "</body></html>";

        char resp[1024];
        int body_len = (int)strlen(body);

        snprintf(resp, sizeof(resp),
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/html\r\n"
            "Connection: close\r\n"
            "Content-Length: %d\r\n"
            "\r\n"
            "%s",
            body_len, body);
        ESP_ClearRx();
        (void)ESP_SendData((uint8_t)cid, resp);

        // Close
        {
            char close_cmd[32];
            ESP_ClearRx();
            snprintf(close_cmd, sizeof(close_cmd), "AT+CIPCLOSE=%d\r\n", cid);
            HAL_UART_Transmit(&huart3, (uint8_t*)close_cmd, strlen(close_cmd), 1000);
        }

        ESP_ClearRx();
        BlockPosting(POST_BLOCK_MS);
        return;
    }

    // ---------- 2) Serve ROOT page: GET / HTTP ----------
    if (strstr(p, "GET / HTTP") != NULL)
    {
        const char *body =
            "<!DOCTYPE html>"
            "<html><body>"
            "<h2>WiFi Setup</h2>"
            "<form action=\"/set\" method=\"get\">"
            "SSID:<br><input name=\"ssid\"><br>"
            "PASS:<br><input type=\"password\" name=\"pass\"><br><br>"
            "<input type=\"submit\" value=\"Save\">"
            "</form>"
            "</body></html>";

        // BIGGER BUFFER to avoid truncation/hang
        char resp[1024];
        int body_len = (int)strlen(body);

        snprintf(resp, sizeof(resp),
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/html\r\n"
            "Connection: close\r\n"
            "Content-Length: %d\r\n"
            "\r\n"
            "%s",
            body_len, body);
        ESP_ClearRx();
        (void)ESP_SendData((uint8_t)cid, resp);

        // Close
        {
            char close_cmd[32];
            ESP_ClearRx();
            snprintf(close_cmd, sizeof(close_cmd), "AT+CIPCLOSE=%d\r\n", cid);
            HAL_UART_Transmit(&huart3, (uint8_t*)close_cmd, strlen(close_cmd), 1000);
        }

        ESP_ClearRx();
        BlockPosting(POST_BLOCK_MS);
        return;
    }

    // ---------- 3) Anything else: close ----------
    {
        char close_cmd[32];
        ESP_ClearRx();
        snprintf(close_cmd, sizeof(close_cmd), "AT+CIPCLOSE=%d\r\n", cid);
        HAL_UART_Transmit(&huart3, (uint8_t*)close_cmd, strlen(close_cmd), 1000);
        ESP_ClearRx();
    }
}

void parse_query_kv(char *query)
{
    char *saveptr = NULL;
    char *tok = strtok_r(query, "&", &saveptr);

    while (tok)
    {
        if (strncmp(tok, "ssid=", 5) == 0)
        {
            strncpy(wifi_ssid, tok + 5, sizeof(wifi_ssid) - 1);
            wifi_ssid[sizeof(wifi_ssid) - 1] = 0;
        }
        else if (strncmp(tok, "pass=", 5) == 0)
        {
            strncpy(wifi_pass, tok + 5, sizeof(wifi_pass) - 1);
            wifi_pass[sizeof(wifi_pass) - 1] = 0;
        }

        tok = strtok_r(NULL, "&", &saveptr);
    }
}

static int ESP_WaitConnectResult(uint32_t timeout_ms)
{
    uint32_t t0 = HAL_GetTick();

    while ((HAL_GetTick() - t0) < timeout_ms)
    {
        // ----- FAILURES -----
        if (strstr((char*)esp_rx, "ERROR"))  return -1;
        if (strstr((char*)esp_rx, "FAIL"))   return -1;
        if (strstr((char*)esp_rx, "busy"))   return -1;
        if (strstr((char*)esp_rx, "CLOSED")) return -1;

        // ----- SUCCESSES -----
        if (strstr((char*)esp_rx, "ALREADY CONNECTED")) return 1;
        if (strstr((char*)esp_rx, "CONNECT"))           return 1;
        if (strstr((char*)esp_rx, "OK"))                return 1;

        HAL_Delay(1);
    }

    // timeout
    return 0;
}


static bool ESP_SSL_Connect(uint8_t link_id, const char *host, uint16_t port)
{
    char cmd[128];

    // If already connected, keep it
    ESP_ClearRx();
    snprintf(cmd, sizeof(cmd), "AT+CIPSTATUS\r\n");
    HAL_UART_Transmit(&huart3, (uint8_t*)cmd, strlen(cmd), 1000);
    HAL_Delay(50);
    if (strstr((char*)esp_rx, "STATUS:3") || strstr((char*)esp_rx, "STATUS:4"))
        return true;

    // Start SSL
    ESP_ClearRx();
    snprintf(cmd, sizeof(cmd), "AT+CIPSTART=%u,\"SSL\",\"%s\",%u\r\n",
             (unsigned)link_id, host, (unsigned)port);
    HAL_UART_Transmit(&huart3, (uint8_t*)cmd, strlen(cmd), 3000);

    // Wait connect result
    int r = ESP_WaitConnectResult(8000);
    return (r > 0);
}

static bool ESP_HTTP_POST_KeepAlive(uint8_t link_id,
                                   const char *host, uint16_t port,
                                   const char *path,
                                   const char *json_body)
{
    char req[768];
    int body_len = (int)strlen(json_body);

    int req_len = snprintf(req, sizeof(req),
        "POST %s HTTP/1.1\r\n"
        "Host: %s\r\n"
        "Content-Type: application/json\r\n"
        "Content-Length: %d\r\n"
        "Connection: keep-alive\r\n"
        "\r\n"
        "%s",
        path, host, body_len, json_body);

    if (req_len <= 0 || req_len >= (int)sizeof(req))
        return false;

    // send it over the existing connection
    if (!ESP_SendData(link_id, req))
        return false;

    // optional: read response quickly (so buffers don’t fill)
    // (just wait for "HTTP/1.1" or "+IPD" briefly)
    ESP_WaitFor("HTTP/1.1", 500);

    return true;
}

void BlockPosting(uint32_t ms)
{
    post_blocked = 1;
    post_block_until_ms = HAL_GetTick() + ms;
}
uint8_t PostingAllowed(void)
{
    if (post_blocked && (int32_t)(HAL_GetTick() - post_block_until_ms) >= 0) {
        post_blocked = 0;
    }
    return (post_blocked == 0);
}


/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{

  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_I2C1_Init();
  MX_SPI1_Init();
  MX_USB_DEVICE_Init();
  MX_TIM2_Init();
  MX_USART3_UART_Init();
  ESP_RxStart(); // start the reading from uart
  /* USER CODE BEGIN 2 */

   
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */

      //auth = 1; // nima veze na avtentikacijo
    uint8_t timer2 = 1;
    //uint8_t test = 1;
    uint8_t test2 = 1;

      /* USER CODE BEGIN WHILE */
      while (1)
      {
    	  if(test2){
    	  if(auth && !done && !wifi_reconfig){
    		  CDC_Print("\r\n=== ESP INIT START ===\r\n");

    		      esp_init_status_t st = ESP_Init(wifi_ssid, wifi_pass);

    		          if (st == ESP_INIT_OK)
    		          {
    		        	  //uint8_t resp[512];
    		        	  //uint32_t rlen;

    		        	  ESP_GetAndPrintIP();

    		        	  //ESP_SendCmd_Wait(&huart3, "AT+CWJAP?", "OK", "ERROR", 2000, resp, sizeof(resp), &rlen);
    		        	  //CDC_Print((char*)resp);
    		              done = 1;

    		          }
    		          else
    		          {
    		              CDC_Print("ESP INIT FAILED: ");

    		              switch (st)
    		              {
    		                  case ESP_INIT_NO_AT:
    		                      CDC_Print("No AT response\r\n");
    		                      break;

    		                  case ESP_INIT_WIFI_MODE_FAIL:
    		                      CDC_Print("Failed to set WiFi mode\r\n");
    		                      break;

    		                  case ESP_INIT_JOIN_FAIL:
    		                      CDC_Print("Failed to join AP\r\n");
    		                      break;

    		                  case ESP_INIT_NO_IP:
    		                      CDC_Print("Connected but no IP\r\n");
    		                      break;

    		                  default:
    		                      CDC_Print("Unknown error\r\n");
    		                      break;
    		              }
    		              HAL_Delay(2000);
    		          }

    		          CDC_Print("======================\r\n");
    		  /*if (ESP_SendAT_OK(&huart3, 1000)) {
    		      CDC_Print("ESP OK\r\n");
    		  } else {
    		      CDC_Print("ESP TIMEOUT\r\n");
    		  }*/
    	  }else {
    	        HAL_Delay(1);   // or 5ms
    	  }

    	  if(done && !server_started){
    		  ESP_StartWebServer();
    		  server_started = 1;
    	  }

    	  //static uint32_t t_check = 0;
    	  if(server_started){
    		  /*if(HAL_GetTick() - t_check > 3000){

    			  t_check = HAL_GetTick();
    			      uint8_t resp[512]; uint32_t rlen;

    			      ESP_SendCmd_Wait(&huart3, "AT+CIPSTATUS", "OK", "ERROR", 1000, resp, sizeof(resp), &rlen);
    			      CDC_Print("CIPSTATUS:\r\n");
    			      CDC_Print((char*)resp);
    			      CDC_Print("\r\n");
    		  }*/

    		  if (!esp_busy) {
    		      ESP_Pump();  // only serve web when not doing client transaction
    		  }

    		  if(timer2){
    			  HAL_TIM_Base_Start_IT(&htim2);
    			  CDC_Print("Timer2 start...\r\n");
    			  timer2 = 0;
    		  }
    		  if (send_tick_50ms)
    		  {
    		      send_tick_50ms = 0;

    		      // if web traffic happened recently, do not post now
    		      if (!PostingAllowed()) {
    		          // optional: debug
    		          // CDC_Print("POST blocked (web active)\r\n");
    		          continue;
    		      }

    		      esp_busy = 1;

    		      if (!link_ok) {
    		    	  CDC_Print("connecting");
    		          link_ok = ESP_SSL_Connect(4, "manda-untrailed-debbra.ngrok-free.dev", 443);
    		          if (!link_ok) { esp_busy = 0; continue; }
    		      }

    		      bool ok = ESP_HTTP_POST_KeepAlive(4, "manda-untrailed-debbra.ngrok-free.dev", 443,
    		                                        "/gyro/latest", "X: 0.001, Y: 0.002, Z: 0.003");

    		      if (!ok) {
    		    	  CDC_Print("sending");
    		          link_ok = 0;
    		          ESP_ClearRx();
    		          HAL_UART_Transmit(&huart3, (uint8_t*)"AT+CIPCLOSE=4\r\n", 14, 1000);
    		      }

    		      esp_busy = 0;
    		  }
    	  }


    	  if (wifi_reconfig)
		  {
    		  HAL_TIM_Base_Stop_IT(&htim2);
    		  timer2 = 1;
			  CDC_Print("Reconfiguring WiFi...\r\n");

			  // Stop server cleanly
			  ESP_SendCmd_Wait(&huart3, "AT+CIPSERVER=0", "OK", "ERROR", 1000, NULL, 0, NULL);

			  for (int i = 0; i < 5; i++)   // ESP supports up to 5 links (0–4)
			      {
			          char cmd[32];
			          ESP_ClearRx();
			          snprintf(cmd, sizeof(cmd), "AT+CIPCLOSE=%d\r\n", i);
			          HAL_UART_Transmit(&huart3, (uint8_t*)cmd, strlen(cmd), 500);
			          HAL_Delay(20);
			      }


			  // Optional: disconnect AP
			  ESP_SendCmd_Wait(&huart3, "AT+CWQAP", "OK", "ERROR", 1000, NULL, 0, NULL);

			  done = 0;
			  server_started = 0;
			  wifi_reconfig = 0;
			  link_ok = 0;

			  HAL_Delay(500);
		  }
    	  HAL_Delay(1);
	  }

   }
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */

  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
  RCC_PeriphCLKInitTypeDef PeriphClkInit = {0};

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI|RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_BYPASS;
  RCC_OscInitStruct.HSEPredivValue = RCC_HSE_PREDIV_DIV1;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL9;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2) != HAL_OK)
  {
    Error_Handler();
  }
  PeriphClkInit.PeriphClockSelection = RCC_PERIPHCLK_USB|RCC_PERIPHCLK_USART3
                              |RCC_PERIPHCLK_I2C1;
  PeriphClkInit.Usart3ClockSelection = RCC_USART3CLKSOURCE_PCLK1;
  PeriphClkInit.I2c1ClockSelection = RCC_I2C1CLKSOURCE_HSI;
  PeriphClkInit.USBClockSelection = RCC_USBCLKSOURCE_PLL_DIV1_5;
  if (HAL_RCCEx_PeriphCLKConfig(&PeriphClkInit) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief I2C1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_I2C1_Init(void)
{

  /* USER CODE BEGIN I2C1_Init 0 */

  /* USER CODE END I2C1_Init 0 */

  /* USER CODE BEGIN I2C1_Init 1 */

  /* USER CODE END I2C1_Init 1 */
  hi2c1.Instance = I2C1;
  hi2c1.Init.Timing = 0x00201D2B;
  hi2c1.Init.OwnAddress1 = 0;
  hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
  hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
  hi2c1.Init.OwnAddress2 = 0;
  hi2c1.Init.OwnAddress2Masks = I2C_OA2_NOMASK;
  hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
  hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;
  if (HAL_I2C_Init(&hi2c1) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Analogue filter
  */
  if (HAL_I2CEx_ConfigAnalogFilter(&hi2c1, I2C_ANALOGFILTER_ENABLE) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Digital filter
  */
  if (HAL_I2CEx_ConfigDigitalFilter(&hi2c1, 0) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN I2C1_Init 2 */

  /* USER CODE END I2C1_Init 2 */

}

/**
  * @brief SPI1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_SPI1_Init(void)
{

  /* USER CODE BEGIN SPI1_Init 0 */

  /* USER CODE END SPI1_Init 0 */

  /* USER CODE BEGIN SPI1_Init 1 */

  /* USER CODE END SPI1_Init 1 */
  /* SPI1 parameter configuration*/
  hspi1.Instance = SPI1;
  hspi1.Init.Mode = SPI_MODE_MASTER;
  hspi1.Init.Direction = SPI_DIRECTION_2LINES;
  hspi1.Init.DataSize = SPI_DATASIZE_8BIT;
  hspi1.Init.CLKPolarity = SPI_POLARITY_HIGH;
  hspi1.Init.CLKPhase = SPI_PHASE_2EDGE;
  hspi1.Init.NSS = SPI_NSS_SOFT;
  hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_8;
  hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
  hspi1.Init.TIMode = SPI_TIMODE_DISABLE;
  hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
  hspi1.Init.CRCPolynomial = 7;
  hspi1.Init.CRCLength = SPI_CRC_LENGTH_DATASIZE;
  hspi1.Init.NSSPMode = SPI_NSS_PULSE_DISABLE;
  if (HAL_SPI_Init(&hspi1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN SPI1_Init 2 */

  /* USER CODE END SPI1_Init 2 */

}

/**
  * @brief TIM2 Initialization Function
  * @param None
  * @retval None
  */
static void MX_TIM2_Init(void)
{

  /* USER CODE BEGIN TIM2_Init 0 */

  /* USER CODE END TIM2_Init 0 */

  TIM_ClockConfigTypeDef sClockSourceConfig = {0};
  TIM_MasterConfigTypeDef sMasterConfig = {0};

  /* USER CODE BEGIN TIM2_Init 1 */

  /* USER CODE END TIM2_Init 1 */
  htim2.Instance = TIM2;
  htim2.Init.Prescaler = 599;
  htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim2.Init.Period = 119;
  htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim2.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
  if (HAL_TIM_Base_Init(&htim2) != HAL_OK)
  {
    Error_Handler();
  }
  sClockSourceConfig.ClockSource = TIM_CLOCKSOURCE_INTERNAL;
  if (HAL_TIM_ConfigClockSource(&htim2, &sClockSourceConfig) != HAL_OK)
  {
    Error_Handler();
  }
  sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
  sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
  if (HAL_TIMEx_MasterConfigSynchronization(&htim2, &sMasterConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN TIM2_Init 2 */
  HAL_NVIC_SetPriority(TIM2_IRQn, 2, 0);
  HAL_NVIC_EnableIRQ(TIM2_IRQn);
  /* USER CODE END TIM2_Init 2 */

}

/**
  * @brief TIM3 Initialization Function
  * @param None
  * @retval None
  */
static void MX_TIM3_Init(void)
{

  /* USER CODE BEGIN TIM3_Init 0 */

  /* USER CODE END TIM3_Init 0 */

  TIM_ClockConfigTypeDef sClockSourceConfig = {0};
  TIM_MasterConfigTypeDef sMasterConfig = {0};

  /* USER CODE BEGIN TIM3_Init 1 */

  /* USER CODE END TIM3_Init 1 */
  htim3.Instance = TIM3;
  htim3.Init.Prescaler = 599;
  htim3.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim3.Init.Period = 119;
  htim3.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim3.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
  if (HAL_TIM_Base_Init(&htim3) != HAL_OK)
  {
    Error_Handler();
  }
  sClockSourceConfig.ClockSource = TIM_CLOCKSOURCE_INTERNAL;
  if (HAL_TIM_ConfigClockSource(&htim3, &sClockSourceConfig) != HAL_OK)
  {
    Error_Handler();
  }
  sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
  sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
  if (HAL_TIMEx_MasterConfigSynchronization(&htim3, &sMasterConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN TIM3_Init 2 */
  HAL_NVIC_SetPriority(TIM3_IRQn, 1, 0);
  HAL_NVIC_EnableIRQ(TIM3_IRQn);
  /* USER CODE END TIM3_Init 2 */

}

/**
  * @brief USART3 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART3_UART_Init(void)
{

  /* USER CODE BEGIN USART3_Init 0 */

  /* USER CODE END USART3_Init 0 */

  /* USER CODE BEGIN USART3_Init 1 */

  /* USER CODE END USART3_Init 1 */
  huart3.Instance = USART3;
  huart3.Init.BaudRate = 115200;
  huart3.Init.WordLength = UART_WORDLENGTH_8B;
  huart3.Init.StopBits = UART_STOPBITS_1;
  huart3.Init.Parity = UART_PARITY_NONE;
  huart3.Init.Mode = UART_MODE_TX_RX;
  huart3.Init.HwFlowCtl = UART_HWCONTROL_RTS_CTS;
  huart3.Init.OverSampling = UART_OVERSAMPLING_16;
  huart3.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart3.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart3) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART3_Init 2 */

  /* USER CODE END USART3_Init 2 */

}

/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  /* USER CODE BEGIN MX_GPIO_Init_1 */

  /* USER CODE END MX_GPIO_Init_1 */

  /* GPIO Ports Clock Enable */
  __HAL_RCC_GPIOE_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOF_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOE, CS_I2C_SPI_Pin|LD4_Pin|LD3_Pin|LD5_Pin
                          |LD7_Pin|LD9_Pin|LD10_Pin|LD8_Pin
                          |LD6_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pins : DRDY_Pin MEMS_INT3_Pin MEMS_INT4_Pin MEMS_INT1_Pin
                           MEMS_INT2_Pin */
  GPIO_InitStruct.Pin = DRDY_Pin|MEMS_INT3_Pin|MEMS_INT4_Pin|MEMS_INT1_Pin
                          |MEMS_INT2_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_EVT_RISING;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  /* --- MEMS_INT2 (PE1) real EXTI interrupt --- */
	GPIO_InitStruct.Pin = MEMS_INT2_Pin;       // GPIO_PIN_1
	GPIO_InitStruct.Mode = GPIO_MODE_IT_RISING;
	GPIO_InitStruct.Pull = GPIO_NOPULL;
	HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  /*Configure GPIO pin : CS_I2C_SPI_Pin */
  GPIO_InitStruct.Pin = CS_I2C_SPI_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
  HAL_GPIO_Init(CS_I2C_SPI_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pin : B1_Pin */
  GPIO_InitStruct.Pin = B1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(B1_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pins : LD4_Pin LD3_Pin LD5_Pin LD7_Pin
                           LD9_Pin LD10_Pin LD8_Pin LD6_Pin */
  GPIO_InitStruct.Pin = LD4_Pin|LD3_Pin|LD5_Pin|LD7_Pin
                          |LD9_Pin|LD10_Pin|LD8_Pin|LD6_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  /* USER CODE BEGIN MX_GPIO_Init_2 */
  HAL_NVIC_SetPriority(EXTI1_IRQn, 0, 0);
  HAL_NVIC_EnableIRQ(EXTI1_IRQn);
  /* USER CODE END MX_GPIO_Init_2 */
}

/* USER CODE BEGIN 4 */

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}
#ifdef USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
