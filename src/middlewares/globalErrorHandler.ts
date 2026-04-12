import { NextFunction, Request, Response } from "express"
import { Prisma } from "../../generated/prisma/client.js";

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {

    let statusCode = 500;
    let errorMessage = "Internal Server Error";
    let errorDetails = err.message || err;

    // JSON SyntaxError (malformed request body)
    if (err instanceof SyntaxError && "body" in err) {
        statusCode = 400;
        errorMessage = "Invalid JSON in request body";
        errorDetails = err.message;
    }
    // Prisma validation error (invalid data types, missing fields)
    else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        errorMessage = "Your provided data is invalid";
        errorDetails = err.message;
    }
    // Prisma known request errors (P2002, P2025, P2003, etc.)
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        errorDetails = err.message;

        if (err.code === "P2002") {
            // Unique constraint violation (duplicate entry)
            statusCode = 409;
            errorMessage = "A resource with this identifier already exists";
        } else if (err.code === "P2025") {
            // Record not found
            statusCode = 404;
            errorMessage = "Record not found";
        } else if (err.code === "P2003") {
            // Foreign key constraint violation
            statusCode = 400;
            errorMessage = "Related resource not found";
        } else if (err.code === "P2014") {
            // Relation violation
            statusCode = 400;
            errorMessage = "This operation violates a required relation";
        }
    }
    // Prisma database connection error
    else if (err instanceof Prisma.PrismaClientInitializationError) {
        statusCode = 503;
        errorMessage = "Database connection failed. Please try again later";
        errorDetails = err.message;
    }
    // Prisma unknown/unexpected database error
    else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        statusCode = 500;
        errorMessage = "An unexpected database error occurred";
        errorDetails = err.message;
    }
    // Custom "not found" or "inactive" errors thrown from services
    else if (err.message?.includes("not found") || err.message?.includes("inactive")) {
        statusCode = 404;
        errorMessage = err.message;
    }
    // Custom validation errors (Price, Stock, Rating, etc.)
    else if (err.message?.includes("Price") || err.message?.includes("Stock") || err.message?.includes("Rating")) {
        statusCode = 400;
        errorMessage = err.message;
    }
    // Custom conflict errors (status transitions, stock issues, already deleted, etc.)
    else if (err.message?.includes("Cannot transition") || err.message?.includes("already") || err.message?.includes("Insufficient") || err.message?.includes("Only PLACED")) {
        statusCode = 409;
        errorMessage = err.message;
    }
    // Custom authorization errors
    else if (err.message?.includes("do not own") || err.message?.includes("only review")) {
        statusCode = 403;
        errorMessage = err.message;
    }

    res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: errorDetails,
    });
}

export default errorHandler
