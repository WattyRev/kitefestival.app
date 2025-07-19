import { css } from "../../../styled-system/css";

export const Table = ({ className, children, ...props }) => {
    return (
        <table
            className={`${className} ${css({
                margin: "8px",
                width: "100%",
            })}`}
            {...props}
        >
            {children}
        </table>
    );
};

export const Thead = ({ className, children, ...props }) => {
    return (
        <thead
            className={`${className} ${css({ background: "sectionBackground" })}`}
            {...props}
        >
            {children}
        </thead>
    );
};

export const Tbody = ({ className, children, ...props }) => {
    return (
        <tbody className={className} {...props}>
            {children}
        </tbody>
    );
};

export const Tr = ({ className, children, ...props }) => {
    return (
        <tr
            className={`${className} ${css({ _even: { background: "sectionBackground" } })}`}
            {...props}
        >
            {children}
        </tr>
    );
};

export const Th = ({ className, children, ...props }) => {
    return (
        <th className={`${className} ${css({ padding: "8px" })}`} {...props}>
            {children}
        </th>
    );
};

export const Td = ({ className, children, ...props }) => {
    return (
        <td className={`${className} ${css({ padding: "8px" })}`} {...props}>
            {children}
        </td>
    );
};
