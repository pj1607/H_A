import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./AppRoute"; 
import ScrollToTop from "./pages/ScrollToTop";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <ScrollToTop/>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1F2937", 
            color: "#F9FAFB",    
            borderRadius: "8px",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: "500",
          },

        }}
      />
      <AppRoutes />
    </Router>
  );
}

export default App;