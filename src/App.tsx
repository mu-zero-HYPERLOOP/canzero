import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import DebugPanel from "./pages/DebugPanel";
import ControlPanel from "./pages/ControlPanel";
import "./App.css";

function App() {

  return (
        <BrowserRouter>
            <div className="App">
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<ControlPanel />} />
                    <Route path="DebugPanel" element={<DebugPanel />} />
                </Route>
            </Routes>
            </div>
        </BrowserRouter>
  );
}

export default App;
