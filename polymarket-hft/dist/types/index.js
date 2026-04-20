"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionError = exports.RiskError = exports.TradingError = void 0;
// Error types
class TradingError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'TradingError';
    }
}
exports.TradingError = TradingError;
class RiskError extends TradingError {
    constructor(message, details) {
        super(message, 'RISK_VIOLATION', details);
    }
}
exports.RiskError = RiskError;
class ExecutionError extends TradingError {
    constructor(message, details) {
        super(message, 'EXECUTION_FAILED', details);
    }
}
exports.ExecutionError = ExecutionError;
//# sourceMappingURL=index.js.map