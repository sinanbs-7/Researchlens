import { AppError } from './errorHandler.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req[source]);
      if (!parsed.success) {
        const errorDetails = parsed.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }));

        const primaryMessage = errorDetails.length > 0 
          ? errorDetails[0].message 
          : 'Invalid request data.';

        const err = new AppError(primaryMessage, 400, 'VALIDATION_ERROR');
        err.details = errorDetails;
        throw err;
      }
      req[source] = parsed.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}
