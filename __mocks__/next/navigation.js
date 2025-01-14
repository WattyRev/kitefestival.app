export const usePathname = () => '/';

let search;

export const useRouter = () => ({
    push: (url) => {
        search = url.split('?')[1];
    },
})

export const useSearchParams = () => {
    return new URLSearchParams(search);
}