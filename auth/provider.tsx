import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type AuthUser = {
  username: string;
  email?: string;
  instrument?: string;
};

type SignInInput = {
  username: string;
  password: string;
};

type RegisterInput = {
  username: string;
  email: string;
  password: string;
  instrument: string;
  acceptTerms: boolean;
};

type AuthActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  registeredUsers: AuthUser[];
  isAuthenticated: boolean;
  signIn: (input: SignInInput) => Promise<AuthActionResult>;
  registerUser: (input: RegisterInput) => Promise<AuthActionResult>;
  forgotPassword: (identity: string) => Promise<AuthActionResult>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const MOCK_REQUEST_DELAY_MS = 360;

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function upsertUser(users: AuthUser[], nextUser: AuthUser) {
  const normalizedUsername = nextUser.username.trim().toLowerCase();
  const existingIndex = users.findIndex(
    (user) => user.username.trim().toLowerCase() === normalizedUsername,
  );

  if (existingIndex < 0) {
    return [...users, nextUser];
  }

  const updatedUsers = [...users];
  updatedUsers[existingIndex] = {
    ...updatedUsers[existingIndex],
    ...nextUser,
  };

  return updatedUsers;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>([]);

  const signIn = useCallback(async (input: SignInInput): Promise<AuthActionResult> => {
    const username = input.username.trim();
    const password = input.password.trim();

    if (!username || !password) {
      return { ok: false, error: "Informe usuário e senha para entrar." };
    }

    await wait(MOCK_REQUEST_DELAY_MS);

    const nextUser = { username };
    setUser(nextUser);
    setRegisteredUsers((currentUsers) => upsertUser(currentUsers, nextUser));

    return { ok: true };
  }, []);

  const registerUser = useCallback(async (input: RegisterInput): Promise<AuthActionResult> => {
    const username = input.username.trim();
    const email = input.email.trim();
    const password = input.password.trim();
    const instrument = input.instrument.trim();

    if (!username || !email || !password || !instrument) {
      return { ok: false, error: "Preencha todos os campos do cadastro." };
    }

    if (!input.acceptTerms) {
      return { ok: false, error: "Você precisa aceitar os termos e condições." };
    }

    await wait(MOCK_REQUEST_DELAY_MS);

    const nextUser = {
      username,
      email,
      instrument,
    };
    setUser(nextUser);
    setRegisteredUsers((currentUsers) => upsertUser(currentUsers, nextUser));

    return { ok: true };
  }, []);

  const forgotPassword = useCallback(async (identity: string): Promise<AuthActionResult> => {
    await wait(240);

    const label = identity.trim() || "seu usuário";

    return {
      ok: true,
      message: `Instruções de recuperação foram enviadas para ${label} (simulado).`,
    };
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      registeredUsers,
      isAuthenticated: user !== null,
      signIn,
      registerUser,
      forgotPassword,
      signOut,
    }),
    [forgotPassword, registerUser, registeredUsers, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
