const API_URL = process.env.REACT_APP_API_URL;

const runTest = async (url) => {
  const res = await fetch(`${API_URL}/run-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  return await res.json();
};