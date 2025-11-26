export default function BookTablePage() {
    return (
        <div className="container mx-auto p-8 text-center">
            <div className="card p-12 max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-6 text-gray-900">Book a Table</h1>
                <p className="text-xl text-gray-600 mb-8">Reserve your table at Pippali for an authentic Indian dining experience.</p>
                <a
                    href="https://pippali.booketbord.dk/onlinebooking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-block text-lg"
                >
                    Book Now (External)
                </a>
            </div>
        </div>
    );
}
