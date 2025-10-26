import Link from "next/link";
import { css } from "../../../styled-system/css";

const StyledLink = ({className = "", ...props}) => {
    return (
        <Link className={`${className} ${css({
            color: "link",
            textDecoration: "underline",
            _hover: {
                color: "linkHoverColor",
            },
        })}`} {...props} />
    )
}

export default StyledLink;