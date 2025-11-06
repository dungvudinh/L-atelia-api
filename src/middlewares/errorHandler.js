const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
  
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID' });
    }
  
    res.status(500).json({
      message: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  };
  export default errorHandler;
  // module.exports = errorHandler;