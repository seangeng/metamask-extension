import { createSelector } from 'reselect';
import { Action } from 'redux'; // Import types for actions
import * as actionConstants from '../../store/actionConstants';
import { FALLBACK_LOCALE } from '../../../shared/modules/i18n';

/**
 * Interface for the locale messages part of the state
 */
interface LocaleMessagesState {
  current?: { [key: string]: string }; // Messages for the current locale
  currentLocale?: string; // User's selected locale (unsafe for Intl API)
  en?: { [key: string]: string }; // English locale messages
}

/**
 * Payload for the SET_CURRENT_LOCALE action
 */
interface SetCurrentLocaleAction extends Action {
  type: typeof actionConstants.SET_CURRENT_LOCALE;
  payload: {
    messages: { [key: string]: string };
    locale: string;
  };
}

/**
 * Type for actions that can be handled by reduceLocaleMessages
 */
type LocaleMessagesActions = SetCurrentLocaleAction;

/**
 * Initial state for localeMessages reducer
 */
const initialState: LocaleMessagesState = {};

/**
 * Reducer for localeMessages
 */
export default function reduceLocaleMessages(
  state: LocaleMessagesState = initialState,
  action: LocaleMessagesActions,
): LocaleMessagesState {
  switch (action.type) {
    case actionConstants.SET_CURRENT_LOCALE:
      return {
        ...state,
        current: action.payload.messages,
        currentLocale: action.payload.locale,
      };
    default:
      return state;
  }
}

/**
 * Interface for the overall Redux state
 */
interface AppState {
  localeMessages: LocaleMessagesState;
}

/**
 * This selector returns a code from file://./../../../app/_locales/index.json.
 * NOT SAFE FOR INTL API USE. Use getIntlLocale instead for that.
 *
 * @param state The overall state
 * @returns {string | undefined} the user's selected locale.
 */
export const getCurrentLocale = (state: AppState): string | undefined =>
  state.localeMessages.currentLocale;

/**
 * This selector returns a BCP 47 Language Tag for use with the Intl API.
 *
 * @returns {Intl.UnicodeBCP47LocaleIdentifier} the user's selected locale.
 */
export const getIntlLocale = createSelector(
  getCurrentLocale,
  (locale): string =>
    Intl.getCanonicalLocales(
      locale ? locale.replace(/_/gu, '-') : FALLBACK_LOCALE,
    )[0],
);

/**
 * This selector returns the current locale messages.
 *
 * @param state The overall state
 * @returns {Record<string, string> | undefined} the current locale's messages.
 */
export const getCurrentLocaleMessages = (
  state: AppState,
): Record<string, string> | undefined => state.localeMessages.current;

/**
 * This selector returns the English locale messages.
 *
 * @param state The overall state
 * @returns {Record<string, string> | undefined} the English locale's messages.
 */
export const getEnLocaleMessages = (
  state: AppState,
): Record<string, string> | undefined => state.localeMessages.en;
