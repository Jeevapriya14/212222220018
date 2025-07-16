import axios from "axios";

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
          Authorization: `Bearer ${process.env.REACT_APP_ACCESS_TOKEN}`,
        },
      }
    );
  } catch (error) {
    
  }
};

export default logEvent;
