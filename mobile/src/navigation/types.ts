/**
 * Navigation type definitions for the fitness app.
 *
 * Separating types here keeps navigators clean and provides
 * a single source of truth for screen params across the app.
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Health: undefined;
};

/**
 * Root-level param list. Each branch is its own nested navigator.
 * Using the 'Auth' / 'Main' split lets React Navigation conditionally
 * render the correct stack based on authentication state, which
 * automatically handles the transition animation and prevents
 * the user from navigating "back" to the login screen.
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
