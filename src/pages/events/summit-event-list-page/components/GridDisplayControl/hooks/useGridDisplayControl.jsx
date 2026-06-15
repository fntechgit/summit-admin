import { useSelector } from "react-redux";

const useGridDisplayControl = (id) => {
  const allControls = useSelector(
    (state) => state.allGridDisplayControlsState?.allControls ?? []
  );
  const control = allControls.find((c) => c.id === id) || {};
  const {
    selectedColumns = [],
  } = control;

  return {
    selectedColumns
  };
};

export default useGridDisplayControl;
