"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
const validateRegister = (options) => {
    if (options.username.length <= 3) {
        return [
            {
                field: 'username',
                message: 'Length must be greater than 3',
            },
        ];
    }
    if (options.username.includes('@')) {
        return [
            {
                field: 'username',
                message: 'Username cannot include @',
            },
        ];
    }
    if (!options.email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
        return [
            {
                field: 'email',
                message: 'Invalid email',
            },
        ];
    }
    if (options.password.length <= 8) {
        return [
            {
                field: 'password',
                message: 'Length must be greater than 8',
            },
        ];
    }
    return null;
};
exports.validateRegister = validateRegister;
//# sourceMappingURL=validateRegister.js.map