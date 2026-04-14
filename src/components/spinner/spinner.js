import "./spinner.css";

const Spinner = ({ isLoading, children }) => {
  return (
    <>
      {children}

      {isLoading && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </>
  );
};

export default Spinner;