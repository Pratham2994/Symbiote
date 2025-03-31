import React from "react";
import { Github } from "lucide-react";
import { hackathons } from "../utils/data";
import { cardHover } from "../utils/animations";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-void-black text-ghost-lilac">
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <section className="mb-12">
          <h1 className="text-4xl font-bold mb-2">
            Hi,{" "}
            <span className="bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
              User
            </span>
            ! 👋
          </h1>
          <p className="text-ghost-lilac/70 text-lg">
            Ready to build something amazing?
          </p>
        </section>

        {/* Upcoming Hackathons Section */}
        <section className="mb-24">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Upcoming Hackathons</h2>
            <button className="px-4 py-2 text-sm bg-venom-purple rounded-lg shadow-neon hover:shadow-lg hover:bg-venom-purple/90 transition-all">
              Explore All
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {hackathons.map((hackathon) => (
              <div
                key={hackathon.id}
                className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 hover:border-venom-purple/40 transition-all group cursor-pointer"
                whileHover={cardHover}
              >
                <div className="relative mb-4 rounded-lg overflow-hidden">
                  <img
                    src={hackathon.image}
                    alt={hackathon.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void-black/80 to-transparent" />
                  <span className="absolute bottom-2 left-2 px-3 py-1 bg-venom-purple/90 rounded-full text-sm">
                    {hackathon.date}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-venom-purple transition-colors">
                  {hackathon.name}
                </h3>
                <p className="text-ghost-lilac/70 mb-4 line-clamp-2">
                  {hackathon.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ghost-lilac/60">
                    {hackathon.participants} participants
                  </span>
                  <span className="text-sm font-medium text-venom-purple">
                    {hackathon.prize}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-venom-purple/20 py-6">
          <div className="flex justify-between items-center">
            <p className="text-ghost-lilac/60 text-sm">
              © 2025 Symbiote. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-ghost-lilac/60 text-sm">Connect with us</span>
              <a
                href="#"
                className="text-ghost-lilac/60 hover:text-venom-purple transition-colors"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
