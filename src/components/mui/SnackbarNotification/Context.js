import { createContext, useContext } from "react";

const SnackbarNotificationContext = createContext(null);

export const useSnackbarMessage = () => useContext(SnackbarNotificationContext);

export default SnackbarNotificationContext;
