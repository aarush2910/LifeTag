import { Link } from "react-router-dom"

const members = [
    // {
    //     name: 'Shaziya Malik',
    //     role: 'UI/UX Designer',
    //     avatar: './shazu.jpg',
    //     // link: '#',
    // },
    // {
    //     name: 'Varun Chauhan',
    //     role: 'Full-Stack Developer',
    //     avatar: './4.jpg',
    //     link: '#',
    // },
    {
        name: 'Aarush Chauhan',
        role: 'Backend Developer',
        avatar: './aarush.jpg',
        link: '#',
    },
    {
        name: 'Pari Dubey',
        role: 'Research & Development',
        avatar: './pari.jpg',
        link: '#',
    },
    {
        name: 'Ayush Agarwal',
        role: 'Backend Developer',
        avatar: './ayush.jpg',
        link: '#',
    },
    {
        name: 'Unender Pal',
        role: 'Frontend Developer',
        avatar: './uno.jpg',
        link: '#',
    },

    {
        name: 'Yash Bhardwaj',
        role: 'Data Analyst',
        avatar: './Yash.jpg',
        link: '#',
    },
]

export default function TeamSection() {
    return (
        <section className="bg-gray-50 py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-5xl border-t px-6">
                <span className="text-caption -ml-6 -mt-3.5 block w-max bg-gray-50 px-6 dark:bg-gray-950">Our Team</span>
                <div className="mt-12 gap-4 sm:grid sm:grid-cols-2 md:mt-24">
                    <div className="sm:w-3/5">
                        <h2 className="text-3xl font-bold sm:text-4xl">Meet the Team Behind LifeTag</h2>
                    </div>
                    <div className="mt-6 sm:mt-0">
                        <p>
                        We are a group of final-year B.Tech students passionate about merging technology with animal welfare. LifeTag is our step toward a smarter, more compassionate system for managing livestock across India.
                        </p>                            
                    </div>
                </div>
                <div className="mt-12 md:mt-24">
                    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((member, index) => (
                            <div
                                key={index}
                                className="group overflow-hidden">
                                <img
                                    className="h-96 w-full rounded-md object-cover object-top grayscale transition-all duration-500 hover:grayscale-0 group-hover:h-[22.5rem] group-hover:rounded-xl"
                                    src={member.avatar}
                                    alt={`${member.name} profile`}
                                    width="826"
                                    height="1239"
                                />
                                <div className="px-2 pt-2 sm:pb-0 sm:pt-4">
                                    <div className="flex justify-between">
                                        <h3 className="text-base font-medium transition-all duration-500 group-hover:tracking-wider">{member.name}</h3>
                                        <span className="text-xs">_0{index + 1}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-muted-foreground inline-block translate-y-6 text-sm opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">{member.role}</span>
                                        {/* <Link
                                            to={member.link}
                                            className="group-hover:text-primary-600 dark:group-hover:text-primary-400 inline-block translate-y-8 text-sm tracking-wide opacity-0 transition-all duration-500 hover:underline group-hover:translate-y-0 group-hover:opacity-100">
                                            Linktree
                                        </Link> */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
