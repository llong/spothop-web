export const navigationUtils = {
  redirectTo: (path: string) => {
    window.location.href = path;
  },
  
  reload: () => {
    window.location.reload();
  },
  
  redirectWithMessage: (path: string, message: string) => {
    const separator = path.includes('?') ? '&' : '?';
    window.location.href = `${path}${separator}message=${encodeURIComponent(message)}`;
  },
  
  redirectWithParam: (path: string, key: string, value: string) => {
    const separator = path.includes('?') ? '&' : '?';
    window.location.href = `${path}${separator}${key}=${encodeURIComponent(value)}`;
  }
};