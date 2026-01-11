export const confirmAction = async (message: string): Promise<boolean> => {
  return window.confirm(message);
};