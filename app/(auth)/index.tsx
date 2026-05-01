import Octicons from "@expo/vector-icons/Octicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../auth/provider";
import { type AppTheme, useAppTheme } from "../../theme";

type AuthMode = "login" | "register";

type LoginFormValues = {
  username: string;
  password: string;
};

type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  instrument: string;
  acceptTerms: boolean;
};

const INSTRUMENT_OPTIONS = [
  "Vocal",
  "Baixo",
  "Guitarra",
  "Bateria",
  "Teclado",
  "Violão",
  "Outro",
] as const;

export default function AuthScreen() {
  const { theme, resolvedMode } = useAppTheme();
  const { signIn, registerUser, forgotPassword } = useAuth();
  const styles = createStyles(theme, resolvedMode);
  const isDark = resolvedMode === "dark";

  const [mode, setMode] = useState<AuthMode>("login");
  const [isRecovering, setIsRecovering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    shouldUnregister: false,
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    shouldUnregister: false,
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      instrument: "Vocal",
      acceptTerms: false,
    },
  });

  const {
    control: loginControl,
    handleSubmit: handleLoginSubmit,
    getValues: getLoginValues,
    clearErrors: clearLoginErrors,
    formState: {
      errors: loginErrors,
      isSubmitting: isLoginSubmitting,
    },
  } = loginForm;

  const {
    control: registerControl,
    handleSubmit: handleRegisterSubmit,
    getValues: getRegisterValues,
    clearErrors: clearRegisterErrors,
    formState: {
      errors: registerErrors,
      isSubmitting: isRegisterSubmitting,
    },
  } = registerForm;

  const isSubmitting = isLoginSubmitting || isRegisterSubmitting || isRecovering;

  const placeholderColor = useMemo(
    () => (isDark ? "#6B7280" : "#64748B"),
    [isDark],
  );

  const clearStatus = useCallback(() => {
    setErrorMessage("");
    setFeedbackMessage("");
  }, []);

  const onSwitchMode = useCallback((nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage("");
    setFeedbackMessage("");
    clearLoginErrors();
    clearRegisterErrors();
  }, [clearLoginErrors, clearRegisterErrors]);

  const onLogin = handleLoginSubmit(async (values) => {
    clearStatus();
    const result = await signIn(values);

    if (!result.ok) {
      setErrorMessage(result.error ?? "Não foi possível entrar.");
    }
  });

  const onRegister = handleRegisterSubmit(async (values) => {
    clearStatus();
    const result = await registerUser({
      username: values.username,
      email: values.email,
      password: values.password,
      instrument: values.instrument,
      acceptTerms: values.acceptTerms,
    });

    if (!result.ok) {
      setErrorMessage(result.error ?? "Não foi possível cadastrar.");
      return;
    }

    setFeedbackMessage("Cadastro realizado. Você entrou na sessão atual.");
  });

  const onForgotPassword = useCallback(async () => {
    clearStatus();
    setIsRecovering(true);

    const identity =
      getLoginValues("username").trim()
      || getRegisterValues("email").trim()
      || getRegisterValues("username").trim();
    const result = await forgotPassword(identity);

    setIsRecovering(false);

    if (!result.ok) {
      setErrorMessage(result.error ?? "Não foi possível iniciar a recuperação.");
      return;
    }

    setFeedbackMessage(result.message ?? "Recuperação iniciada.");
  }, [clearStatus, forgotPassword, getLoginValues, getRegisterValues]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Octicons name="pulse" size={18} color={styles.badgeIcon.color} />
            <Text style={styles.badgeText}>GuideMusic</Text>
          </View>
          <Text style={styles.title}>Acesso</Text>
        </View>

        <View style={styles.card}>
          {mode === "login" ? (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Usuário</Text>
                <Controller
                  control={loginControl}
                  name="username"
                  rules={{
                    required: "Informe o usuário.",
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="seu usuário"
                      placeholderTextColor={placeholderColor}
                      style={styles.input}
                      value={value}
                    />
                  )}
                />
                {!!loginErrors.username && (
                  <Text style={styles.fieldErrorText}>{loginErrors.username.message}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <Controller
                  control={loginControl}
                  name="password"
                  rules={{
                    required: "Informe a senha.",
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.passwordInputWrap}>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isSubmitting}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="sua senha"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry={!showLoginPassword}
                        style={styles.passwordInput}
                        value={value}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                        disabled={isSubmitting}
                        onPress={() => setShowLoginPassword((current) => !current)}
                        style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
                      >
                        <MaterialCommunityIcons
                          name={showLoginPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={styles.eyeIcon.color}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                {!!loginErrors.password && (
                  <Text style={styles.fieldErrorText}>{loginErrors.password.message}</Text>
                )}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Esqueci minha senha"
                disabled={isSubmitting}
                onPress={() => {
                  void onForgotPassword();
                }}
                style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
              >
                <Text style={styles.linkText}>Esqueci minha senha</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Entrar"
                disabled={isSubmitting}
                onPress={() => {
                  void onLogin();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (isSubmitting || pressed) && styles.primaryButtonPressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Entrar</Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ir para cadastro"
                disabled={isSubmitting}
                onPress={() => onSwitchMode("register")}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryButtonText}>Cadastrar usuário</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Usuário</Text>
                <Controller
                  control={registerControl}
                  name="username"
                  rules={{
                    required: "Informe o usuário.",
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="nome de usuário"
                      placeholderTextColor={placeholderColor}
                      style={styles.input}
                      value={value}
                    />
                  )}
                />
                {!!registerErrors.username && (
                  <Text style={styles.fieldErrorText}>{registerErrors.username.message}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <Controller
                  control={registerControl}
                  name="email"
                  rules={{
                    required: "Informe o email.",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Informe um email válido.",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      keyboardType="email-address"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="seu@email.com"
                      placeholderTextColor={placeholderColor}
                      style={styles.input}
                      value={value}
                    />
                  )}
                />
                {!!registerErrors.email && (
                  <Text style={styles.fieldErrorText}>{registerErrors.email.message}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <Controller
                  control={registerControl}
                  name="password"
                  rules={{
                    required: "Informe a senha.",
                    minLength: {
                      value: 6,
                      message: "A senha precisa ter ao menos 6 caracteres.",
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.passwordInputWrap}>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isSubmitting}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="crie uma senha"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry={!showRegisterPassword}
                        style={styles.passwordInput}
                        value={value}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={showRegisterPassword ? "Ocultar senha" : "Mostrar senha"}
                        disabled={isSubmitting}
                        onPress={() => setShowRegisterPassword((current) => !current)}
                        style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
                      >
                        <MaterialCommunityIcons
                          name={showRegisterPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={styles.eyeIcon.color}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                {!!registerErrors.password && (
                  <Text style={styles.fieldErrorText}>{registerErrors.password.message}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirmar senha</Text>
                <Controller
                  control={registerControl}
                  name="confirmPassword"
                  rules={{
                    required: "Confirme a senha.",
                    validate: (value) => (
                      value === registerForm.getValues("password") || "As senhas não conferem."
                    ),
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.passwordInputWrap}>
                      <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isSubmitting}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="confirme a senha"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry={!showRegisterConfirmPassword}
                        style={styles.passwordInput}
                        value={value}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={showRegisterConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                        disabled={isSubmitting}
                        onPress={() => setShowRegisterConfirmPassword((current) => !current)}
                        style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
                      >
                        <MaterialCommunityIcons
                          name={showRegisterConfirmPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={styles.eyeIcon.color}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                {!!registerErrors.confirmPassword && (
                  <Text style={styles.fieldErrorText}>{registerErrors.confirmPassword.message}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Instrumento</Text>
                <Controller
                  control={registerControl}
                  name="instrument"
                  rules={{
                    required: "Selecione um instrumento.",
                  }}
                  render={({ field: { value, onChange } }) => (
                    <View style={styles.instrumentList}>
                      {INSTRUMENT_OPTIONS.map((instrument) => {
                        const isActive = value === instrument;

                        return (
                          <Pressable
                            key={instrument}
                            accessibilityRole="button"
                            accessibilityLabel={`Selecionar ${instrument}`}
                            disabled={isSubmitting}
                            onPress={() => onChange(instrument)}
                            style={({ pressed }) => [
                              styles.instrumentOption,
                              isActive && styles.instrumentOptionActive,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={[styles.instrumentText, isActive && styles.instrumentTextActive]}>
                              {instrument}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                />
                {!!registerErrors.instrument && (
                  <Text style={styles.fieldErrorText}>{registerErrors.instrument.message}</Text>
                )}
              </View>

              <Controller
                control={registerControl}
                name="acceptTerms"
                rules={{
                  validate: (value) => value || "Você precisa aceitar os termos e condições.",
                }}
                render={({ field: { value, onChange } }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Aceitar termos e condições"
                    disabled={isSubmitting}
                    onPress={() => onChange(!value)}
                    style={({ pressed }) => [styles.termsRow, pressed && styles.pressed]}
                  >
                    <Octicons
                      name={value ? "check-circle-fill" : "circle"}
                      size={18}
                      color={value ? styles.termsChecked.color : styles.termsUnchecked.color}
                    />
                    <Text style={styles.termsText}>Aceito os termos e condições</Text>
                  </Pressable>
                )}
              />
              {!!registerErrors.acceptTerms && (
                <Text style={styles.fieldErrorText}>{registerErrors.acceptTerms.message}</Text>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cadastrar usuário"
                disabled={isSubmitting}
                onPress={() => {
                  void onRegister();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (isSubmitting || pressed) && styles.primaryButtonPressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Cadastrar usuário</Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar para login"
                disabled={isSubmitting}
                onPress={() => onSwitchMode("login")}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
              </Pressable>
            </View>
          )}

          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          {!!feedbackMessage && <Text style={styles.feedbackText}>{feedbackMessage}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, resolvedMode: "light" | "dark") {
  const isDark = resolvedMode === "dark";
  const pageBackground = isDark ? "#0D1117" : theme.colors.background;
  const cardBackground = isDark ? "#111827" : theme.colors.surface;
  const borderColor = isDark ? "#2D333B" : theme.colors.border;
  const inputBackground = isDark ? "#0B1220" : theme.colors.surfaceMuted;
  const textColor = isDark ? "#E6EDF3" : theme.colors.text;
  const mutedText = isDark ? "#8B949E" : theme.colors.textMuted;
  const primary = isDark ? "#1F6FEB" : theme.colors.primary;
  const secondaryText = isDark ? "#A5B4FC" : "#1D4ED8";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: pageBackground,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 24,
      gap: 16,
      justifyContent: "center",
    },
    hero: {
      gap: 8,
      alignItems: "center",
    },
    badge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor,
      backgroundColor: cardBackground,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    badgeIcon: {
      color: isDark ? "#93C5FD" : "#2563EB",
    },
    badgeText: {
      color: textColor,
      fontSize: 13,
      fontFamily: theme.fonts.medium,
    },
    title: {
      color: textColor,
      fontSize: 30,
      fontFamily: theme.fonts.bold,
    },
    card: {
      width: "100%",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 14,
      backgroundColor: cardBackground,
      padding: 14,
      gap: 12,
      alignSelf: "center",
      maxWidth: 480,
    },
    form: {
      gap: 12,
    },
    field: {
      gap: 6,
    },
    label: {
      color: textColor,
      fontSize: 13,
      fontFamily: theme.fonts.medium,
    },
    input: {
      minHeight: 44,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 10,
      backgroundColor: inputBackground,
      color: textColor,
      fontSize: 14,
      fontFamily: theme.fonts.regular,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    passwordInputWrap: {
      minHeight: 44,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 10,
      backgroundColor: inputBackground,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 12,
      paddingRight: 6,
    },
    passwordInput: {
      flex: 1,
      color: textColor,
      fontSize: 14,
      fontFamily: theme.fonts.regular,
      paddingVertical: 9,
      paddingRight: 8,
    },
    eyeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    eyeIcon: {
      color: mutedText,
    },
    fieldErrorText: {
      color: "#FB7185",
      fontSize: 12,
      fontFamily: theme.fonts.regular,
      lineHeight: 17,
    },
    instrumentList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    instrumentOption: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 7,
      backgroundColor: inputBackground,
    },
    instrumentOptionActive: {
      backgroundColor: primary,
      borderColor: primary,
    },
    instrumentText: {
      color: textColor,
      fontSize: 13,
      fontFamily: theme.fonts.medium,
    },
    instrumentTextActive: {
      color: "#FFFFFF",
    },
    termsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 4,
    },
    termsChecked: {
      color: isDark ? "#60A5FA" : "#2563EB",
    },
    termsUnchecked: {
      color: mutedText,
    },
    termsText: {
      color: textColor,
      fontSize: 13,
      fontFamily: theme.fonts.regular,
      flex: 1,
    },
    primaryButton: {
      minHeight: 46,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: primary,
      paddingHorizontal: 16,
    },
    primaryButtonPressed: {
      opacity: 0.85,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontFamily: theme.fonts.semibold,
    },
    secondaryButton: {
      minHeight: 42,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      backgroundColor: inputBackground,
      paddingHorizontal: 16,
    },
    secondaryButtonText: {
      color: secondaryText,
      fontSize: 14,
      fontFamily: theme.fonts.medium,
    },
    linkButton: {
      alignSelf: "flex-start",
      paddingVertical: 2,
    },
    linkText: {
      color: secondaryText,
      fontSize: 13,
      fontFamily: theme.fonts.medium,
    },
    errorText: {
      color: "#FB7185",
      fontSize: 13,
      fontFamily: theme.fonts.medium,
      lineHeight: 19,
    },
    feedbackText: {
      color: isDark ? "#86EFAC" : "#166534",
      fontSize: 13,
      fontFamily: theme.fonts.medium,
      lineHeight: 19,
    },
    pressed: {
      opacity: 0.82,
    },
  });
}
