import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../../../logUpdate";
import validatePasscode, { NoPasscodeError, InvalidPasscodeError } from "../../../passcodes/validatePasscode";
import patchActivity, { NoPatchableKeysError } from "../patchActivity";
import { DELETE, PATCH } from "../route";

jest.mock('../../../passcodes/validatePasscode');
jest.mock('../../../logUpdate');
jest.mock('../patchActivity');

describe('activities/[activityId]/route', () => {
    beforeEach(() => {
        validatePasscode.mockResolvedValue();
    });
    describe('DELETE', () => {
        it('returns a 400 if no passcode was provided', async () => {
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({})
            }
            const response = await DELETE(mockReq, { params: { activityId: '1' } });
            expect(response).toEqual({ data: {message: 'No passcode provided' }, status: 400 });
        });
        it('returns a 403 if the provided passcode does not match the editor passcode', async () => {
            validatePasscode.mockRejectedValue(new InvalidPasscodeError())
            const mockReq = {
                json: jest.fn().mockResolvedValue({ passcode: 'boogers' })
            };
            const response = await DELETE(mockReq, { params: { activityId: '1' } });
            expect(response).toEqual({ data: {message: 'Provided passcode is invalid' }, status: 403 });
        });
        it('returns a 400 if no activity ID was provided', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({ passcode: 'editorPasscode' })
            };
            const response = await DELETE(mockReq, { params: {} });
            expect(response).toEqual({ data: {message: 'No activity ID provided' }, status: 400 });
        });
        it('deletes the activity from the database', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({ passcode: 'editorPasscode' })
            };
            await DELETE(mockReq, { params: { activityId: '1' } });
            expect(sql).toHaveBeenCalledWith(['DELETE FROM activities WHERE id = ', ''], '1');
        });
        it('logs the update to the changes table', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({ passcode: 'editorPasscode' })
            };
            await DELETE(mockReq, { params: { activityId: '1' } });
            expect(logUpdateByTableName).toHaveBeenCalledWith('activities');
        });
    });

    describe('PATCH', () => {
        beforeEach(() => {
            patchActivity.mockResolvedValue();
        })
        it('returns a 400 if no passcode was provided', async () => {
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    activity: { foo: 'bar' }
                })
            };
            const response = await PATCH(mockReq, { params: { activityId: '1' } });
            expect(response).toEqual({ data: {message: 'No passcode provided' }, status: 400 });
        });
        it('returns a 403 if the provided passcode does not match the editor passcode', async () => {
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    passcode: 'boogers' ,
                    activity: { foo: 'bar' }
                })
            };
            const response = await PATCH(mockReq, { params: { activityId: '1' } });
            expect(response).toEqual({ data: {message: 'Provided passcode is invalid' }, status: 403 });
        });
        it('returns 400 if the activity did not provide any patchable keys', async () => {
            patchActivity.mockRejectedValue(new NoPatchableKeysError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    passcode: 'editorPasscode' ,
                    activity: { foo: 'bar' }
                })
            };
            const response = await PATCH(mockReq, { params: { activityId: '1' } });
            expect(response).toEqual({ data: {message: 'No patchable keys provided for activity 1' }, status: 400 });
        });
        it('patches the activity and logs the  update', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    passcode: 'editorPasscode' ,
                    activity: { foo: 'bar' }
                })
            };
            const response = await PATCH(mockReq, { params: { activityId: '1' } });
            expect(patchActivity).toHaveBeenCalledWith('1', { foo: 'bar' });
            expect(logUpdateByTableName).toHaveBeenCalledWith('activities');
            expect(response).toEqual({ data: {} });
        });
    });
});