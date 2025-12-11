import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { UserContext } from '../context/userContext';
import { apiFetch } from '../config/api';
import { Colors } from '@/constants/Colors';

const RegisterScreen = () => {
    const { login } = useContext(UserContext);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    async function registerForPushNotificationsAsync() {
        let token;
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        if (finalStatus === 'granted') {
            token = (await Notifications.getExpoPushTokenAsync()).data;
        }

        return token;
    }

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleRegister = async () => {
        setError('');
        
        if (!username || !email || !name || !surname || !password) {
            setError("Please fill all fields");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }
        
        setIsLoading(true);
        let token = null;
        try {
            token = await registerForPushNotificationsAsync();
        } catch (tokenError) {
            console.log("Push notification token not available, continuing without it");
        }

        try {
            const response = await apiFetch('/users/register', {
                method: 'POST',
                body: JSON.stringify({
                    name, surname, username, email, password, token: token || undefined
                })
            });

            const jsonData = await response.json();

            if (response.status === 201) {
                setUsername('');
                setEmail('');
                setName('');
                setSurname('');
                setPassword('');
                setError('');
                
                if(jsonData.newUser) {
                    login(jsonData.newUser);
                navigation.navigate("FaceIdVideo");
                } else {
                    setError("Invalid credentials or registration failed");
                }
            } else if (response.status === 400) {
                const errorMsg = jsonData.message || "Registration failed. Please check your input.";
                setError(errorMsg);
            } else {
                setError(jsonData.message || "Registration failed");
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error.message || "Failed to connect to the server.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
                <KeyboardAvoidingView 
                    style={[styles.container, { backgroundColor: theme.background }]}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Text style={styles.emoji}>👋</Text>
                                <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
                                <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                                    Join us and start your healthy lifestyle journey
                                </Text>
                            </View>

                            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                                <View style={styles.form}>
                                    <View style={styles.inputContainer}>
                                        <TextInput 
                                            style={[
                                                styles.input, 
                                                { 
                                                    backgroundColor: theme.inputBackground,
                                                    borderColor: theme.inputBorder,
                                                    color: theme.inputText,
                                                }
                                            ]}
                                            placeholder="Username" 
                                            placeholderTextColor={theme.placeholder}
                                            value={username} 
                                            onChangeText={(text) => {
                                                setUsername(text);
                                                setError("");
                                            }}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput 
                                            style={[
                                                styles.input, 
                                                { 
                                                    backgroundColor: theme.inputBackground,
                                                    borderColor: theme.inputBorder,
                                                    color: theme.inputText,
                                                }
                                            ]}
                                            placeholder="Email" 
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="email-address"
                                            value={email} 
                                            onChangeText={(text) => {
                                                setEmail(text);
                                                setError("");
                                            }}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput 
                                            style={[
                                                styles.input, 
                                                { 
                                                    backgroundColor: theme.inputBackground,
                                                    borderColor: theme.inputBorder,
                                                    color: theme.inputText,
                                                }
                                            ]}
                                            placeholder="Name" 
                                            placeholderTextColor={theme.placeholder}
                                            value={name} 
                                            onChangeText={(text) => {
                                                setName(text);
                                                setError("");
                                            }}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput 
                                            style={[
                                                styles.input, 
                                                { 
                                                    backgroundColor: theme.inputBackground,
                                                    borderColor: theme.inputBorder,
                                                    color: theme.inputText,
                                                }
                                            ]}
                                            placeholder="Surname" 
                                            placeholderTextColor={theme.placeholder}
                                            value={surname} 
                                            onChangeText={(text) => {
                                                setSurname(text);
                                                setError("");
                                            }}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput 
                                            style={[
                                                styles.input, 
                                                { 
                                                    backgroundColor: theme.inputBackground,
                                                    borderColor: theme.inputBorder,
                                                    color: theme.inputText,
                                                }
                                            ]}
                                            placeholder="Password" 
                                            placeholderTextColor={theme.placeholder}
                                            value={password} 
                                            onChangeText={(text) => {
                                                setPassword(text);
                                                setError("");
                                            }}
                                            secureTextEntry 
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    {error ? (
                                        <View style={[styles.errorContainer, { backgroundColor: theme.errorBackground }]}>
                                            <Text style={[styles.errorMessage, { color: theme.error }]}>{error}</Text>
                                        </View>
                                    ) : null}

                                    <TouchableOpacity 
                                        onPress={handleRegister} 
                                        activeOpacity={0.8}
                                        style={[
                                            styles.button, 
                                            { 
                                                backgroundColor: theme.gradientStart,
                                                opacity: isLoading ? 0.6 : 1
                                            }
                                        ]}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.buttonText}>
                                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={[
                                        styles.loginContainer,
                                        { 
                                            borderTopColor: colorScheme === 'dark' 
                                                ? 'rgba(255, 255, 255, 0.1)' 
                                                : 'rgba(0, 0, 0, 0.05)'
                                        }
                                    ]}>
                                        <Text style={[styles.loginText, { color: theme.secondaryText }]}>
                                            Already have an account?{' '}
                                        </Text>
                                        <TouchableOpacity 
                                            onPress={() => navigation.navigate('Login')}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.loginLink, { color: theme.gradientStart }]}>
                                                Sign In
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        paddingTop: 20,
    },
    emoji: {
        fontSize: 72,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    card: {
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 12,
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        marginBottom: 4,
    },
    input: {
        height: 56,
        borderWidth: 2,
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 16,
    },
    errorContainer: {
        padding: 14,
        borderRadius: 12,
        marginTop: 4,
    },
    errorMessage: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    button: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#667eea',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
    },
    loginText: {
        fontSize: 15,
    },
    loginLink: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default RegisterScreen;
