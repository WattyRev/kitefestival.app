import getPasscodeByName from '../getPasscodeByName';
import validatePasscode, { NoPasscodeError, InvalidPasscodeError } from '../validatePasscode';

jest.mock('../getPasscodeByName');

describe('validatePasscode', () => {
    beforeEach(() => {
        getPasscodeByName.mockImplementation((userType) => {
            if (userType === 'editor') {
                return 'boogers';
            }
            if (userType === 'user') {
                return 'abcd';
            }
        })
    });

    it('returns true if the passcode matches the editor and editor is set', async () => {
        const response = await validatePasscode('boogers', ['editor']);
        expect(response).toBe(true);
    });
    it('returns true if the passcode matches the user and user is set', async () => {
        const response = await validatePasscode('abcd', ['user']);
        expect(response).toBe(true);
    });
    it('returns true if the passcode matches the editor and both are set', async () => {
        const response = await validatePasscode('boogers', ['editor', 'user']);
        expect(response).toBe(true);
    });
    it('returns true if the passcode matches the user and both are set', async () => {
        const response = await validatePasscode('abcd', ['editor', 'user']);
        expect(response).toBe(true);
    });
    it('throws NoPasscodeError if no passcode is provided', async () => {
        await expect(validatePasscode(null, ['editor', 'user'])).rejects.toThrow(NoPasscodeError);
    });
    it('throws InvalidPasscodeError if the passcode does not match the set level', async () => {
        await expect(validatePasscode('nothing', ['editor', 'user'])).rejects.toThrow(InvalidPasscodeError);
    });
});