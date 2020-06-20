import React from 'react';
import {
    required,
    match,
    list,
    validateMany,
    hasError,
    anyErrors
} from '../src/formValidation';

describe('required', () => {
    it('returns description if it calls without value', () => {
        const requiredWithoutValue = required('desc')();
        expect(requiredWithoutValue).toMatch(/desc/);
    });

    it('returns undefined if it calls with value', () => {
        const requiredWithoutValue = required('desc')('value');
        expect(requiredWithoutValue).not.toBeDefined();
    });
});

describe('match', () => {
    it('returns description if value not match to regex', () => {
        const isNotNumber = match(/^[0-9]+$/, 'desc')('value');
        expect(isNotNumber).toMatch(/desc/);
    });

    it('returns undefined if value match to regex', () => {
        const isNumber = match(/^[0-9]+$/, 'desc')('123');
        expect(isNumber).not.toBeDefined();
    });
});

describe('list', () => {
    it('returns validator description if the value is not supplied', () => {
        const withoutValue = list(required('Phone number is required'))();
        expect(withoutValue).toMatch('Phone number is required');
    });

    it('returns undefined if the value is supplied', () => {
        const withValue = list(required('Phone number is required'))('value');
        expect(withValue).not.toBeDefined();
    });
});

const validators = {
    firstName: required('First name is required'),
    lastName: required('Last name is required'),
    phoneNumber: list(
        required('Phone number is required'),
        match(
            /^[0-9+()\- ]*$/,
            'Only numbers, spaces and these symbols are allowed: ( ) + -'
        )
    )
};

describe('validateMany', () => {
    it('returns validation value if the value is not supplied', () => {
        const result = validateMany(validators, {
            firstName: ''
        });
        expect(result).toMatchObject({ firstName: 'First name is required' });
    });

    it('returns undefined if the validation value is supplied', () => {
        const result = validateMany(validators, {
            firstName: 'value'
        });
        expect(result).toMatchObject({ firstName: undefined });
    });
});