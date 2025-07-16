const Url = require("../models/Url");
const { nanoid } = require("nanoid");


const moment = require("moment");
const logEvent = require("../middleware/logger");


const isValidUrl = (url) => {
  const pattern = new RegExp("^(https?:\\/\\/)?([\\w\\-]+\\.)+[\\w\\-]+(\\/\\S*)?$", "i");
  return pattern.test(url);
};


const createShortUrl = async (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  try {
    if (!isValidUrl(url)) {
      await logEvent("backend", "error", "handler", "Invalid URL format.");
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const expiry = moment().add(validity, "minutes").toISOString();
    let finalShortCode = shortcode;

    
    if (shortcode) {
      const existing = await Url.findOne({ shortCode: shortcode });
      if (existing) {
        await logEvent("backend", "warn", "handler", "Custom shortcode already exists.");
        return res.status(409).json({ error: "Shortcode already in use" });
      }
    } else {
     
      finalShortCode = nanoid(6);
    }

    const newUrl = new Url({
      originalUrl: url,
      shortCode: finalShortCode,
      expiry: expiry,
    });

    await newUrl.save();
    await logEvent("backend", "info", "service", `Short URL created: ${finalShortCode}`);

    res.status(201).json({
      shortLink: `http://localhost:5000/${finalShortCode}`,
      expiry: expiry,
    });

  } catch (err) {
    await logEvent("backend", "fatal", "handler", `Error in createShortUrl: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};


const redirectToOriginal = async (req, res) => {
  const { shortcode } = req.params;

  try {
    const urlEntry = await Url.findOne({ shortCode: shortcode });

    if (!urlEntry) {
      await logEvent("backend", "error", "handler", "Shortcode not found.");
      return res.status(404).json({ error: "Shortcode not found" });
    }

    const now = moment().toISOString();
    if (now > urlEntry.expiry) {
      await logEvent("backend", "warn", "handler", "Shortcode expired.");
      return res.status(410).json({ error: "Link expired" });
    }

    
    const clickData = {
      timestamp: new Date(),
      referrer: req.get("Referrer") || "Direct",
      location: req.ip || "Unknown",
    };

    urlEntry.clicks.push(clickData);
    await urlEntry.save();

    await logEvent("backend", "info", "service", `Redirecting shortcode ${shortcode}`);
    res.redirect(urlEntry.originalUrl);

  } catch (err) {
    await logEvent("backend", "fatal", "handler", `Redirect error: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

const getUrlStats = async (req, res) => {
  const { shortcode } = req.params;

  try {
    const urlEntry = await Url.findOne({ shortCode: shortcode });

    if (!urlEntry) {
      await logEvent("backend", "error", "handler", "Stats: shortcode not found.");
      return res.status(404).json({ error: "Shortcode not found" });
    }

    const stats = {
      originalUrl: urlEntry.originalUrl,
      shortCode: urlEntry.shortCode,
      createdAt: urlEntry.createdAt,
      expiry: urlEntry.expiry,
      clickCount: urlEntry.clicks.length,
      clicks: urlEntry.clicks.map(click => ({
        timestamp: click.timestamp,
        referrer: click.referrer,
        location: click.location,
      })),
    };

    await logEvent("backend", "info", "service", `Stats fetched for shortcode ${shortcode}`);
    res.json(stats);

  } catch (err) {
    await logEvent("backend", "fatal", "handler", `Stats error: ${err.message}`);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createShortUrl,
  redirectToOriginal,
  getUrlStats,
};
