import { sql } from "@vercel/postgres";
import { GET, POST, PATCH } from "../route";
import { randomUUID } from "../../crypto";
import validatePasscode, { NoPasscodeError, InvalidPasscodeError } from "../../passcodes/validatePasscode";
import patchActivity from "../[activityId]/patchActivity";
import logUpdateByTableName from "../../logUpdate";

jest.mock('../../passcodes/validatePasscode');
jest.mock('../../crypto');
jest.mock("../[activityId]/patchActivity");
jest.mock("../../logUpdate");

describe('activities/route', () => {
    describe('GET', () => {
        it('should return a list of activities', async () => {
            sql.mockResolvedValue({ rows: [{
                id: '1',
                title: 'boogers',
                description: 'green things',
                sortindex: 1,
                scheduleindex: null
            }] });
            const response = await GET();
            expect(response).toEqual({ data: {
                activities: [{ id: '1', title: 'boogers', description: 'green things', sortIndex: 1, scheduleIndex: null }]
            }});
        });
    });
    describe('POST', () => {
        beforeEach(() => {
            validatePasscode.mockResolvedValue();
            randomUUID.mockReturnValue('uuid');
        });
        it('returns a 400 if no passcode was provided', async () => {
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    title: 'boogers',
                    description: 'green things'
                })
            };
            const response = await POST(mockReq);
            expect(response).toEqual({ data: {message: 'No passcode provided' }, status: 400 });
        });
        it('returns a 403 if the provided passcode does not match the editor passcode', async () => {
            validatePasscode.mockRejectedValue(new InvalidPasscodeError())
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    passcode: 'boogers',
                    title: 'boogers',
                    description: 'green things'
                })
            };
            const response = await POST(mockReq);
            expect(response).toEqual({ data: {message: 'Provided passcode is invalid' }, status: 403 });
        });
        it('returns a 400 if no title was provided', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    passcode: 'editorPasscode',
                    description: 'green things'
                })
            };
            const response = await POST(mockReq);
            expect(response).toEqual({ data: {message: 'No title provided' }, status: 400 });
        });
        it('inserts the activity and returns it', async () => {
            sql.mockResolvedValue({ rows: []});
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    passcode: 'editorPasscode',
                    title: 'boogers',
                    description: 'green things'
                })
            };
            await POST(mockReq);
            expect(sql).toHaveBeenCalledWith([
                'INSERT INTO activities (id, title, description, sortIndex, scheduleIndex) VALUES (',
                ', ',
                ', ',
                ', ',
                ', null)'
            ], expect.anything(), 'boogers', 'green things', 0);
        });

        it('sets the sort index based on what already exists in the table', async () => {
            sql.mockResolvedValue({ rows: [{ sortindex: 5 }]});
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    passcode: 'editorPasscode',
                    title: 'boogers',
                    description: 'green things'
                })
            };
            await POST(mockReq);
            expect(sql).toHaveBeenCalledWith([
                'INSERT INTO activities (id, title, description, sortIndex, scheduleIndex) VALUES (',
                ', ',
                ', ',
                ', ',
                ', null)'
            ], expect.anything(), 'boogers', 'green things', 6);
        });
    });
    describe('PATCH', () => {
        beforeEach(() => {
            validatePasscode.mockResolvedValue();
            patchActivity.mockResolvedValue();
        });
        it('should return a 400 if no passcode was provided', async () => {
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    activities: [{ foo: 'bar' }]
                })
            };
            const response = await PATCH(mockReq);
            expect(response).toEqual({ data: {message: 'No passcode provided'}, status: 400 });
        });
        it('should return a 403 if the provided passcode does not match the editor passcode', async () => {
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    passcode: 'boogers',
                    activities: [{ foo: 'bar' }]
                })
            };
            const response = await PATCH(mockReq);
            expect(response).toEqual({ data: {message: 'Provided passcode is invalid'}, status: 403 });
        });
        it('should call patchActivity for each activity and log the update', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({ 
                    passcode: 'boogers',
                    activities: [
                        { description: 'nothing' },
                        { id: '1', description: 'test' },
                        { id: '2', sortIndex: 2}
                    ]
                })
            };
            await PATCH(mockReq);
            expect(patchActivity).toHaveBeenCalledTimes(2);
            expect(patchActivity).toHaveBeenCalledWith('1', { id: '1', description: 'test' });
            expect(patchActivity).toHaveBeenCalledWith('2', { id: '2', sortIndex: 2});
            expect(logUpdateByTableName).toHaveBeenCalledWith('activities');
        });
    });
});