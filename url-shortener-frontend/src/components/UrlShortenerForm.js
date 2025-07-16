import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
} from "@mui/material";
import axios from "axios";
import logEvent from "../middleware/logger";

const initialInput = { url: "", validity: "", shortcode: "" };

const UrlShortenerForm = () => {
    
  const [inputs, setInputs] = useState(Array(5).fill(initialInput));

  const [results, setResults] = useState([]);

  const handleChange = (index, field, value) => {
    const newInputs = [...inputs];
    newInputs[index][field] = value;
    setInputs(newInputs);
    

  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateInputs = () => {
    for (let i = 0; i < inputs.length; i++) {
      const { url, validity, shortcode } = inputs[i];
      if (url.trim() === "") continue;

      if (!validateUrl(url)) {
        alert(`Row ${i + 1}: Invalid URL`);
        return false;
      }

      if (validity && (!Number.isInteger(+validity) || +validity <= 0)) {
        alert(`Row ${i + 1}: Validity must be a positive integer`);
        return false;
      }

      if (shortcode && !/^[a-zA-Z0-9]{1,10}$/.test(shortcode)) {
        alert(
          `Row ${i + 1}: Shortcode must be alphanumeric and max 10 chars`
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    const toSend = inputs
      .filter((item) => item.url.trim() !== "")
      .map(({ url, validity, shortcode }) => ({
        url,
        validity: validity ? parseInt(validity) : undefined,
        shortcode: shortcode || undefined,
      }));

    if (toSend.length === 0) {
      alert("Please enter at least one URL.");
      return;
    }

    const newResults = [];

    for (const item of toSend) {
      try {
        await logEvent("frontend", "info", "component", `Sending request for URL: ${item.url}`);
        const res = await axios.post("http://localhost:5000/shorturls", item);
        newResults.push(res.data);
        await logEvent("frontend", "info", "component", `Received short URL: ${res.data.shortLink}`);
      } catch (error) {
        alert(`Error for URL ${item.url}: ${error.response?.data?.error || error.message}`);
        await logEvent("frontend", "error", "component", `Error for URL ${item.url}: ${error.message}`);
      }
    }
    setResults(newResults);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        URL Shortener
      </Typography>
      {inputs.map((input, i) => (
        <Paper key={i} sx={{ mb: 2, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Long URL"
                value={input.url}
                onChange={(e) => handleChange(i, "url", e.target.value)}
                required={i === 0}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                type="number"
                label="Validity (minutes)"
                value={input.validity}
                onChange={(e) => handleChange(i, "validity", e.target.value)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Custom Shortcode"
                value={input.shortcode}
                onChange={(e) => handleChange(i, "shortcode", e.target.value)}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
          </Grid>
        </Paper>
      ))}

      <Button variant="contained" onClick={handleSubmit}>
        Shorten URLs
      </Button>

      {results.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Results
          </Typography>
          {results.map((result, i) => (
            <Paper key={i} sx={{ p: 2, mb: 2 }}>
              <Typography>
                Short URL:{" "}
                <a href={result.shortLink} target="_blank" rel="noreferrer">
                  {result.shortLink}
                </a>
              </Typography>
              <Typography>Expires at: {new Date(result.expiry).toLocaleString()}</Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default UrlShortenerForm;
