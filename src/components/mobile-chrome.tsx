/** Screens that bring their own header and action bar on phones, like an app's full-screen form. */
const FOCUS_SCREENS = ["/profile/edit"];

/** On a focus screen the phone tab bar steps aside for the screen's own action bar. */
export const isFocusScreen = (pathname: string) => FOCUS_SCREENS.some((path) => pathname.startsWith(path));
