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
import DeckList from "./components/DeckList";
import DeckDetail from "./components/DeckDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* Protected Routes */}
      <Route path="/language-selection" element={
        <ProtectedRoute>
          <LanguageSelection />
        </ProtectedRoute>
      } />
      <Route path="/home/:languageId" element={
        <ProtectedRoute>
          <LanguageHome />
        </ProtectedRoute>
      } />
      <Route path="/text/:languageId/:textId" element={
        <ProtectedRoute>
          <TextPage />
        </ProtectedRoute>
      } />
      <Route path="/practice/:languageId" element={
        <ProtectedRoute>
          <DeckList />
        </ProtectedRoute>
      } />
      <Route path="/deck/:languageId/:deckId" element={
        <ProtectedRoute>
          <DeckDetail />
        </ProtectedRoute>
      } />
      <Route path="/practice/:languageId/:deckId" element={
        <ProtectedRoute>
          <FlashcardPractice />
        </ProtectedRoute>
      } />
    </Routes>
  </BrowserRouter>
);