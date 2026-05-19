class DomainError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends DomainError {
    constructor(message = 'Recurso não encontrado') {
        super(message, 404);
    }
}

class ValidationError extends DomainError {
    constructor(message = 'Dados inválidos') {
        super(message, 400);
    }
}

class ConflictError extends DomainError {
    constructor(message = 'Conflito detectado') {
        super(message, 409);
    }
}

module.exports = {
    DomainError,
    NotFoundError,
    ValidationError,
    ConflictError
};
