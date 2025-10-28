import Link from "next/link";
import { buttonStyles } from "./LinkButton";

const StyledLink = ({ className = "", ...props }) => {
    return <Link className={`${className} ${buttonStyles}`} {...props} />;
};

export default StyledLink;
