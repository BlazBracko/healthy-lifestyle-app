import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { UserContext } from '../context/userContext';
import { apiFetch } from '../config/api';
import { Colors } from '@/constants/Colors';

const Login = () => {
    const { login } = useContext(UserContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleLogin = async () => {
        setError("");
        try {
            const res = await apiFetch('/users/login', {
                method: "POST",
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.status === 200) {
                if (data.user) {
                    login(data.user);
                    navigation.navigate("FaceIdPhoto");
                } else {
                    setError("Invalid credentials or login failed");
                }
            } else {
                setError(data.message || "An unknown error occurred");
            }
        } catch (error) {
            const errorMessage = error.message || "Network error or server is down";
            setError(errorMessage);
            console.error("Login error:", error);
        }
    };

    return (
        <>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
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
                            <Text style={styles.emoji}>🏃</Text>
                            <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
                            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                                Sign in to continue your healthy lifestyle journey
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
                                    onPress={handleLogin} 
                                    activeOpacity={0.8}
                                    style={[styles.button, { backgroundColor: theme.gradientStart }]}
                                >
                                    <Text style={styles.buttonText}>Sign In</Text>
                                </TouchableOpacity>

                                <View style={[
                                    styles.registerContainer,
                                    { 
                                        borderTopColor: colorScheme === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.1)' 
                                            : 'rgba(0, 0, 0, 0.05)'
                                    }
                                ]}>
                                    <Text style={[styles.registerText, { color: theme.secondaryText }]}>
                                        Don't have an account?{' '}
                                    </Text>
                                    <TouchableOpacity 
                                        onPress={() => navigation.navigate('Register')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.registerLink, { color: theme.gradientStart }]}>
                                            Sign Up
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

const styles = StyleSheet.create({
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
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
    },
    registerText: {
        fontSize: 15,
    },
    registerLink: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default Login;
