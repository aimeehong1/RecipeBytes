import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { IngredientsIcon, TipsIcon, SubstitutionIcon } from "../assets/icons";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { Favorite } from "@mui/icons-material";
import axios from "axios";
import css from "../styles/RecipeDetails.module.css";

export default function RecipeDetailView() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [substitutes, setSubstitutes] = useState({});
  const [favorites, setFavorites] = useState(() => {
    try {
      const storedFavorites = localStorage.getItem("favorites");
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = `https://api.spoonacular.com/recipes/${id}/information`;
  const SUBSTITUTES_URL = `https://api.spoonacular.com/food/ingredients/substitutes`;
  const API_KEY = process.env.REACT_APP_SPOONACULAR_API_KEY;

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        setLoading(true);

        const recipeResponse = await axios.get(API_URL, {
          params: { apiKey: API_KEY },
        });
        setRecipe(recipeResponse.data);
        setSummary(recipeResponse.data.summary);

        const ingredientSubstitutes = {};
        const ingredientFetches = recipeResponse.data.extendedIngredients
          .filter((ingredient) => !isInPantry(ingredient.name))
          .map(async (ingredient) => {
            try {
              const substituteResponse = await axios.get(SUBSTITUTES_URL, {
                params: {
                  apiKey: API_KEY,
                  ingredientName: ingredient.name,
                },
              });
              if (substituteResponse.data.substitutes?.length) {
                ingredientSubstitutes[ingredient.name] =
                  substituteResponse.data.substitutes;
              }
            } catch {
              // Handle errors silently
            }
          });

        await Promise.all(ingredientFetches);
        setSubstitutes(ingredientSubstitutes);
      } catch (err) {
        setError("Failed to fetch recipe details");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [id]);

  const isFavorite = (recipeId) => favorites.some((fav) => fav.id === recipeId);

  const toggleFavorite = () => {
    if (isFavorite(recipe.id)) {
      const updatedFavorites = favorites.filter((fav) => fav.id !== recipe.id);
      setFavorites(updatedFavorites);
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    } else {
      const updatedFavorites = [...favorites, recipe];
      setFavorites(updatedFavorites);
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    }
  };

  const isInPantry = (ingredientName) => {
    const pantry = ["flour", "sugar", "eggs", "butter"];
    return pantry.includes(ingredientName.toLowerCase());
  };

  const cleanSummary = (summary) => {
    if (!summary) return "No summary available.";
    const plainText = summary.replace(/<[^>]*>/g, "").trim();
    const sentences = plainText.split(".").slice(0, -2).join(". ") + ".";
    return sentences || "Summary not available.";
  };

  if (loading) {
    return (
      <Box className={css.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={css.errorContainer}>
        <Typography variant="h4" className={css.errorText}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={css.pageContainer}>
      <div className={css.title}>
        <Typography variant="h4" className={css.recipeTitle} sx={{ fontFamily:"'Patrick Hand SC', cursive" }}>
          {recipe.title}
        </Typography>
        <div className={css.favoriteContainer}>
          {isFavorite(recipe.id) ? (
            <button
              className={css.removeFavoriteButton}
              onClick={toggleFavorite}
            >
              <Favorite /> Remove from Favorites
            </button>
          ) : (
            <button className={css.addFavoriteButton} onClick={toggleFavorite}>
              <AddCircleIcon /> Add to Favorites
            </button>
          )}
        </div>
      </div>
      <img src={recipe.image} alt={recipe.title} className={css.recipeImage} />
      <div className={css.timeInfo}>
        {recipe.preparationMinutes && (
          <span className={css.recipeTime}>
            <strong>Prep Time:</strong> {recipe.preparationMinutes} mins
          </span>
        )}
        {recipe.cookingMinutes && (
          <span className={css.recipeTime}>
            <strong>Cook Time:</strong> {recipe.cookingMinutes} mins
          </span>
        )}
        {recipe.readyInMinutes && (
          <span className={css.recipeTime}>
            <strong>Total Time:</strong> {recipe.readyInMinutes} mins
          </span>
        )}
        <Link className={css.navigation} to={`/recipe/${id}/step${1}`}>
          START
        </Link>
      </div>

      <div className={css.contentContainer}>
        <div className={css.ingredientsContainer}>
          <Box className={css.sectionHeader}>
            <IngredientsIcon />
            <Typography variant="h5" className={css.sectionTitle}>
              Ingredients
            </Typography>
          </Box>
          <ul className={css.ingredientsList}>
            {recipe.extendedIngredients.map((item, index) => (
              <li key={index} className={css.ingredientItem}>
                <input
                  type="checkbox"
                  checked={isInPantry(item.name)}
                  disabled
                  className={css.ingredientCheckbox}
                />
                <div className={css.ingredientNeeded}>
                  {item.amount} {item.unit} {item.name}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={css.tipsContainer}>
          <Box className={css.sectionHeader}>
            <TipsIcon />
            <Typography variant="h5" className={css.sectionTitle}>
              Recipe Tips
            </Typography>
          </Box>
          <Typography variant="body1" className={css.tipsText}>
            {cleanSummary(summary)}
          </Typography>
        </div>

        {Object.keys(substitutes).length > 0 && (
          <div className={css.substitutesContainer}>
            <Box className={css.sectionHeader}>
              <SubstitutionIcon />
              <Typography
                variant="h5"
                sx={{ fontFamily: "'Patrick Hand SC', cursive" }}
              >
                Substitutes
              </Typography>
            </Box>
            <ul className={css.substitutesList} style={{ listStyleType: "none" }}>
              {Object.entries(substitutes).map(([ingredient, subs], index) => (
                <li key={index} className={css.substituteItem}
                  style={{
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <strong>{ingredient}:</strong>
                  <span>{subs.join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Box>
  );
}
