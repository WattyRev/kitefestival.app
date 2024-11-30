import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import getPasscodeByName from "../getPasscodeByName";
import { PUT, POST } from "../route";

jest.mock('../getPasscodeByName');

describe('passcodes/route', () => {
    describe('PUT', () => {
        let mockPayload;
        beforeEach(() => {
            getPasscodeByName.mockResolvedValue('admin');
            mockPayload = {
                adminPasscode: 'adminNew',
                editorPasscode: 'boogers',
                userPasscode: 'abcd',
                authentication: 'admin'
            }
        })
        it('changes the provided passcodes', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue(mockPayload)
            };
            await PUT(mockReq);
            expect(sql).toHaveBeenCalledTimes(3);
            expect(sql).toHaveBeenCalledWith([
                'UPDATE passcodes SET passcode = ',
                ' WHERE name = \'admin\'',], 'adminNew');
            expect(sql).toHaveBeenCalledWith([
                'UPDATE passcodes SET passcode = ',
                ' WHERE name = \'editor\'',], 'boogers');
            expect(sql).toHaveBeenCalledWith([
                'UPDATE passcodes SET passcode = ',
                ' WHERE name = \'user\'',], 'abcd');
            expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Admin, Editor, User passcodes have been updated' });
        });
        it('returns a 401 if no authentication is provided', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({mockPayload, authentication: null})
            };
            await PUT(mockReq);
            expect(NextResponse.json).toHaveBeenCalledWith({ message: 'No authentication provided'}, { status: 401 });
        });
        it('returns a 403 if the provided authentication does not match the admin passcode', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({mockPayload, authentication: 'not-admin'})
            };
            await PUT(mockReq);
            expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Provided authentication is invalid'}, { status: 403 });
        });
        it('only updates the admin passcode if that is all that was provided', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    adminPasscode: 'adminNew',
                    authentication: 'admin'
                })
            };
            await PUT(mockReq);
            expect(sql).toHaveBeenCalledWith([
                'UPDATE passcodes SET passcode = ',
                ' WHERE name = \'admin\'',], 'adminNew');
            expect(sql).toHaveBeenCalledTimes(1);
            expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Admin passcode has been updated' });
        });
        it('only updates the editor passcode if that is all that was provided', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    editorPasscode: 'boogers',
                    authentication: 'admin'
                })
            };
            await PUT(mockReq);
            expect(sql).toHaveBeenCalledWith([
                'UPDATE passcodes SET passcode = ',
                ' WHERE name = \'editor\'',], 'boogers');
            expect(sql).toHaveBeenCalledTimes(1);
            expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Editor passcode has been updated' });
        });
        it('only updates the user passcode if that is all that was provided', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    userPasscode: 'abcd',
                    authentication: 'admin'
                })
            };
            await PUT(mockReq);
            expect(sql).toHaveBeenCalledWith([
                'UPDATE passcodes SET passcode = ',
                ' WHERE name = \'user\'',], 'abcd');
            expect(sql).toHaveBeenCalledTimes(1);
            expect(NextResponse.json).toHaveBeenCalledWith({ message: 'User passcode has been updated' });
        });
    });
    describe('POST', () => {
        beforeEach(() => {
            getPasscodeByName.mockImplementation((userType) => {
                if (userType === 'editor') {
                    return 'boogers';
                }
                if (userType === 'user') {
                    return 'abcd';
                }
            })
        })
        it('returns editor userType if editor passcode is provided', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: 'boogers'
                })
            };
            await POST(mockReq);
            expect(NextResponse.json).toHaveBeenCalledWith({ userType: 'editor' });
        });
        it('returns user userType if user passcode is provided', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: 'abcd'
                })
            };
            await POST(mockReq);
            expect(NextResponse.json).toHaveBeenCalledWith({ userType: 'user' });
        });
        it('returns a 400 if no passcode was provided', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({})
            };
            await POST(mockReq);
            expect(NextResponse.json).toHaveBeenCalledWith({ message: 'No passcode provided' }, { status: 400 });
        });
        it('returns a 401 if the passcode does not match a user type', async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: 'nothing'
                })
            };
            await POST(mockReq);
            expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Invalid passcode'}, { status: 401 });
        });
    });
});