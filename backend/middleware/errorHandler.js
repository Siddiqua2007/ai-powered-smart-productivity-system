// Express error handlers MUST have exactly 4 parameters in this exact order!
const errorHandler = (err, req, res, next) => {
    // 1. Log the error to your VS Code terminal cleanly
    console.error("❌ Centralized Error caught:", err.message);
    
    // 2. Decide the response status code
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // 3. Send a clean response to Postman (DO NOT call next() here!)
    res.status(statusCode).json({
        message: err.message || "Internal Server Error"
    });
};

module.exports = errorHandler;
