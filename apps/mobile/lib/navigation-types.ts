import { ParamListBase } from '@react-navigation/native';

export type QuizRoutes = {
  '/quiz-session/[id]': { id: string };
  '/quiz-session/[id]/summary': { id: string };
  '/game-room/[topicId]': { topicId: string };
  'summary': undefined;
  '/(quiz)/summary': undefined;
};

export type QuizNavigationParamList = QuizRoutes & ParamListBase;

export type QuizNavigationProp = {
  navigate: (route: keyof QuizNavigationParamList, params?: any) => void;
  push: (route: keyof QuizNavigationParamList, params?: any) => void;
  replace: (route: keyof QuizNavigationParamList, params?: any) => void;
  goBack: () => void;
}; 