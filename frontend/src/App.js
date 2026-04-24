import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import KyriosAppreciation from "@/components/KyriosAppreciation";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<KyriosAppreciation />} />
          <Route path="/appreciation/kyrios" element={<KyriosAppreciation />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
