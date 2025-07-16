const axios = require("axios");

const logEvent = async (stack, level, pkg, message) => {
  try {
    await axios.post(
      "http://20.244.56.144/evaluation-service/logs",
      {
        stack,
        level,
        package: pkg,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      }
    );
  } catch (error) {
    // handle error silently or log if needed
  }
};

module.exports = logEvent;
