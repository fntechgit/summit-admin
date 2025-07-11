import { createContext, useContext } from "react";

const CustomNotificationContext = createContext(null);

export const useCustomNotification = () =>
  useContext(CustomNotificationContext);

export default CustomNotificationContext;
