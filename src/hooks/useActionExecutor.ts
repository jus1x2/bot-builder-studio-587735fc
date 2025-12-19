export interface UserContext {
  first_name: string;
  last_name: string;
  username: string;
  user_id: string;
  date: string;
  time: string;
  [key: string]: string;
}

export function interpolateVariables(text: string, context: UserContext): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key] || match;
  });
}
