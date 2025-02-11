import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import LanguageSelection from "./components/LanguageSelection";
import LanguageHome from "./pages/LanguageHome";
import TextPage from "./pages/TextPage";
import FlashcardPractice from "./components/FlashcardPractice";
import "./index.css"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/language-selection" element={<LanguageSelection />} />
      <Route path="/home/:languageId" element={<LanguageHome />} />
      <Route path="/text/:languageId/:textId" element={<TextPage />} />
      <Route path="/practice/:languageId" element={<FlashcardPractice />} />
    </Routes>
  </BrowserRouter>
);