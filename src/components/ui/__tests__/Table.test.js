import { render, screen } from "@testing-library/react";
import { Table, Thead, Tbody, Tr, Td, Th } from "../Table";

describe("Table", () => {
    it("renders", async () => {
        render(<Table className="test" data-testid="target" />);

        const table = screen.getByTestId("target");
        expect(table).toHaveClass("test");
        expect(table).toHaveRole("table");
    });

    describe("Thead", () => {
        it("renders", async () => {
            render(
                <Table>
                    <Thead className="test" data-testid="target" />
                </Table>,
            );

            const thead = screen.getByTestId("target");
            expect(thead).toHaveClass("test");
            expect(thead).toHaveRole("rowgroup");
        });
    });

    describe("Tbody", () => {
        it("renders", async () => {
            render(
                <Table>
                    <Tbody className="test" data-testid="target" />
                </Table>,
            );

            const tbody = screen.getByTestId("target");
            expect(tbody).toHaveClass("test");
            expect(tbody).toHaveRole("rowgroup");
        });
    });

    describe("Tr", () => {
        it("renders", async () => {
            render(
                <Table>
                    <Tbody>
                        <Tr className="test" data-testid="target" />
                    </Tbody>
                </Table>,
            );

            const tr = screen.getByTestId("target");
            expect(tr).toHaveClass("test");
            expect(tr).toHaveRole("row");
        });
    });

    describe("Td", () => {
        it("renders", async () => {
            render(
                <Table>
                    <Tbody>
                        <Tr>
                            <Td className="test" data-testid="target" />
                        </Tr>
                    </Tbody>
                </Table>,
            );

            const td = screen.getByTestId("target");
            expect(td).toHaveClass("test");
            expect(td).toHaveRole("cell");
        });
    });

    describe("Th", () => {
        it("renders", async () => {
            render(
                <Table>
                    <Thead>
                        <Tr>
                            <Th className="test" data-testid="target" />
                        </Tr>
                    </Thead>
                </Table>,
            );

            const th = screen.getByTestId("target");
            expect(th).toHaveClass("test");
            expect(th).toHaveRole("columnheader");
        });
    });
});
