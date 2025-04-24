import { Helmet } from "react-helmet";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <>
      <Helmet>
        <html lang="pt-BR" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Eskimo Sorvetes - Unidade Efapi</title>
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body {
            font-family: 'Inter', sans-serif;
            position: relative;
            overflow-x: hidden;
          }
          .orb {
            position: absolute;
            border-radius: 9999px;
            z-index: 0;
            animation: pulseOrb 4s infinite ease-in-out;
          }
        `}</style>
      </Helmet>


      <div className="relative overflow-hidden bg-white text-gray-800">
        <div className="orb bottom-[-60px] right-[-60px] h-40 w-40 bg-yellow-300"></div>
        <div className="orb left-[-40px] top-1/2 h-32 w-32 bg-red-100"></div>

        <header
          className="relative z-10 flex flex-col items-center justify-between gap-4 px-4 py-4 shadow-md md:flex-row md:gap-0 md:px-8"
          data-aos="fade-down"
        >
          <div className="flex items-center gap-4">
            <img
              src="https://eskimo.com.br/wp-content/uploads/2023/03/image-1.png"
              alt="Eskimo Sorvetes"
              className="h-10 transition-transform duration-500 hover:scale-110"
            />
            <span className="text-3xl font-bold text-red-600 md:hidden">
              Efapi
            </span>
          </div>

          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a
              href="#"
              className="font-semibold text-red-600 hover:text-red-800"
            >
              Inicio
            </a>
            <a href="#" className="hover:text-red-600">
              Sobre
            </a>
            <a href="#" className="hover:text-red-600">
              Onde Encontrar
            </a>
          </nav>

          <div className="hidden flex-col items-end gap-2 md:flex md:flex-row md:items-center md:gap-4">
            <button className="rounded-full bg-red-600 px-4 py-2 text-sm text-white shadow-md hover:bg-red-700">
              Fale conosco
            </button>
            <span className="text-5xl font-bold text-red-600">Efapi</span>
          </div>
        </header>

        <section className="relative mx-auto flex max-w-7xl flex-col-reverse items-center gap-8 overflow-hidden bg-white px-6 py-12 lg:flex-row">
          <div
            className="max-w-xl text-center lg:text-left"
            data-aos="fade-right"
          >
            <p className="text-sm font-semibold text-red-500">
              👋 Olá! É bom ter você aqui
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight md:text-5xl">
              Sabores para <br className="hidden md:block" /> todos os gostos
            </h1>
            <p className="mt-4 text-gray-600">
              Transformamos momentos em sabores. Nossos picolés e sorvetes são a
              alegria que derrete na boca e aquece o coração.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <button className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">
                Ver os produtos
              </button>
            </div>
          </div>

          <div className="relative" data-aos="fade-left">
            <img
              src="https://eskimo.com.br/wp-content/uploads/2023/03/Pedrinho-1-1.png"
              alt="Mascote"
              className="mx-auto w-[280px] md:w-[320px]"
            />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-lg">
              🍦 Sabor Incrível!{" "}
              <span className="text-gray-500">2.874 curtidas</span>
            </div>
          </div>
        </section>

        {/* Destaques */}
        <section className="grid grid-cols-1 gap-8 bg-red-600 px-6 py-12 text-center text-white sm:grid-cols-2 md:grid-cols-4">
          {[
            {
              icon: "🏆",
              title: "Maior da América Latina",
              desc: "Somos a maior fabricante de picolés da América Latina",
            },
            {
              icon: "🏠",
              title: "+1300 pontos de vendas",
              desc: "Mais de 100 lojas filiais e 1300 pontos de venda",
            },
            {
              icon: "😊",
              title: "+100 variações de produtos",
              desc: "Grande variedade com mais de 100 apresentações",
            },
            {
              icon: "💰",
              title: "Preço de fábrica",
              desc: "Produtos direto da fábrica para o consumidor",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="space-y-2"
              data-aos="fade-up"
              data-aos-delay={`${i * 200}`}
            >
              <div className="text-4xl">{item.icon}</div>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="text-sm">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Produtos */}
        <section
          className="mx-auto max-w-4xl px-6 py-12 text-center"
          data-aos="fade-up"
        >
          <img
            src="https://eskimo.com.br/wp-content/uploads/2023/03/Group-86-1-1.png"
            alt="Linha de produtos"
            className="mx-auto w-64"
          />
          <h2 className="mt-6 text-2xl font-bold">
            Conheça nossa linha de produtos
          </h2>
          <p className="mt-2 text-gray-600">
            Receitas que unem compostos de primeira-linha nacionais e
            internacionais.
          </p>
          <button className="mt-6 rounded-full bg-yellow-400 px-6 py-3 font-semibold text-white hover:bg-yellow-500">
            Ver todos os produtos
          </button>
        </section>

        <section className="mx-auto max-w-5xl px-6" data-aos="fade-in">
          <img
            src="bob-esponja-banner.png"
            alt="Picolé do Bob Esponja e Patrick"
            className="w-full rounded-xl"
          />
        </section>

        <section
          className="mx-auto grid max-w-5xl items-center gap-8 px-6 py-12 md:grid-cols-2"
          data-aos="fade-up"
        >
          <div>
            <h2 className="text-2xl font-bold">
              Mega lojas espalhadas por Chapecó
            </h2>
            <p className="mt-2 text-gray-600">
              De Norte a Sul, refrescando o paladar dos Chapecoenses. A presença
              marcante da nossa marca pelo país.
            </p>
            <button className="mt-6 rounded-full bg-red-600 px-6 py-3 font-semibold text-white">
              Ver todas as unidades
            </button>
          </div>
          <img
            src="loja-eskimo.png"
            alt="Loja física"
            className="w-full rounded-xl"
          />
        </section>

        <div className="mx-auto max-w-5xl px-6 pb-12" data-aos="fade-in">
          <a
            href="https://admin-panel-eskimo.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-full border px-4 py-3 text-center text-sm font-medium text-red-600 shadow-md transition hover:bg-red-100"
          >
            Área do Lojista
          </a>
        </div>

        <footer className="bg-gray-100 py-6 text-center text-sm text-gray-500">
          © 2025 Eskimo Sorvetes - Unidade Efapi. Todos os direitos reservados.
        </footer>
      </div>
    </>
  );
}