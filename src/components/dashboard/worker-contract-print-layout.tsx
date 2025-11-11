

'use client';

import { Worker } from "@/lib/data";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ContractPrintLayoutProps {
    worker: Worker;
    contractData: any;
}

const numberToWords = require('number-to-words');

const toWordsInKwanza = (num: number): string => {
    if (num === 0) return 'zero';
    const words = numberToWords.toWords(num);
    return words.charAt(0).toUpperCase() + words.slice(1);
};


export function ContractPrintLayout({ worker, contractData }: ContractPrintLayoutProps) {
    const today = new Date();
    const formattedDate = format(today, "dd 'de' MMMM 'de' yyyy", { locale: pt });
    const salaryInWords = toWordsInKwanza(contractData.baseSalary || 0);
    
  return (
    <div className="print-this">
      <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-12 text-sm leading-relaxed font-serif">
        <h1 className="text-center font-bold text-lg mb-6">CONTRATO DE TRABALHO A TERMO INCERTO</h1>
        <p className="text-center mb-6">Artigo 15.º da Lei Geral do Trabalho</p>
        
        <p className="font-bold mb-2">ENTRE:</p>
        <p className="mb-4">
            <span className="font-bold">DS ENGENHOSO – COMÉRCIO E PRESTAÇÃO DE SERVIÇOS (SU), LDA.,</span> com sede em Luanda município e destrito urbano do Talatona, Bairro Kambamba Rua do Siac, Casa nº 191. matriculada na Conservatória do Registo Comercial de Luanda, sob o nº 21.006-21/211209 titular do Número de Identificação Fiscal 5000870595, neste acto representada pelo Sr. {contractData.companySignatory || 'N/A'}, na qualidade de Representante Legal com poderes bastantes para o acto, doravante designada por <span className="font-bold">PRESTADORA DE SERVIÇOS</span>.
        </p>

        <p className="font-bold mb-2">E</p>
        <p className="mb-6">
            <span className="font-bold">{contractData.name || 'N/A'}</span>, de nacionalidade {contractData.nationality || 'Angolana'}, residente habitualmente em {contractData.address || 'Luanda'}, {contractData.maritalStatus || 'solteiro'}, nascido aos {contractData.birthDate || 'N/A'}, titular do B.I nº {contractData.bi || 'N/A'} emitido pelos Serviços de Identificação, Doravante a partir deste contrato designado <span className="font-bold">TRABALHADOR</span>.
        </p>

        <ul className="list-disc list-inside space-y-2 mb-6">
            <li>O EMPREGADOR é uma Empresa de Trabalho Temporário, isto é, uma empresa cujo objeto social consiste na cedência temporária de trabalhadores a terceiros, conforme a Licença de cedência de Pessoal;</li>
            <li>Ao abrigo e nos termos do Decreto Presidencial 31/17, de 22 de Fevereiro e, subsidiariamente as disposições legais aplicáveis da Lei Geral do Trabalho (aprovada pela Lei nº 12/23, de 27 de Dezembro), é celebrado o presente CONTRATO DE TRABALHO A TERMO INCERTO (o “Contrato”) que será regido além dos diplomas supra;</li>
            <li>O EMPREGADOR tem um contrato para execução de um projeto de duração incerta/indefinida, celebrado com o utilizador, e a este o TRABALHADOR aceita ser alocado;</li>
            <li>É celebrado o presente contrato de trabalho que se rege pelas disposições da L.G.T. e respetiva legislação Complementar, Regulamento Interno e ainda pelas cláusulas seguintes:</li>
        </ul>
        
        <p className="font-bold">Cláusula 1ª (Objeto)</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Sujeito aos termos e condições aqui estabelecidos, pelo presente Contrato, o EMPREGADOR admite ao seu serviço o TRABALHADOR, e Este obriga-se a prestar trabalho temporariamente ao «Cliente» do EMPREGADOR, em conformidade com o Contrato de Cedência de Trabalho Temporário celebrado entre o EMPREGADOR e o Cliente, que aqui se dá por integralmente reproduzido para todos os efeitos legais.</li>
            <li>O TRABALHADOR declara expressamente que entende e aceita que a sua contratação ao abrigo deste Contrato é feita exclusivamente para o efeito previsto no número anterior e que, consequentemente, a manutenção do Contrato fica dependente da manutenção do contrato celebrado entre o EMPREGADOR e o Cliente, sem prejuízo da lei.</li>
        </ol>

        <p className="font-bold">Cláusula 2ª (Função Ocupacional)</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Ao TRABALHADOR é garantida a ocupação do posto de trabalho exercendo a função de {contractData.role || 'N/A'}, pertencente ao seu qualificador ocupacional da escala.</li>
        </ol>

        <p className="font-bold">Cláusula 3ª (Início e Duração)</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>O presente contrato de trabalho a termo incerto tem o seu início de vigência na data de assinatura do contrato, e terá a duração enquanto subsistir a causa justificativa da sua celebração, nomeadamente, a manutenção do contrato de prestação de serviços entre o EMPREGADOR e o Cliente, para a prestação de serviço de cedência de estivadores, e desde que o TRABALHADOR mantenha um desempenho produtivo adequado, conduta profissional irrepreensível, assiduidade, pontualidade e observe integralmente as regras e procedimentos internos, incluindo a proibição de consumo de álcool e substâncias ilícitas no local de trabalho, conforme detalhado neste contrato e na legislação aplicável.</li>
            <li>A cessação do contrato ocorrerá nos termos da Lei Geral do Trabalho para contratos por tempo incerto.</li>
        </ol>

        <p className="font-bold">Cláusula 4ª (Remuneração)</p>
         <p className="mb-2">Em contrapartida desse trabalho, o TRABALHADOR terá direito a:</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Uma remuneração mensal Base, no valor de {contractData.baseSalary.toLocaleString('pt-AO')} akz ({salaryInWords} Kwanzas).</li>
            <li>Subsídio de férias: 50% do salário base correspondente à proporcionalidade dos dias trabalhados, correspondente ao período de férias.</li>
            <li>Subsídio de Natal: 50% do salário base correspondente à proporcionalidade dos dias trabalhados.</li>
            <li>Os pontos anteriores são passíveis de descontos relativos a:</li>
            <li>Faltas ou ausências que, nos termos da legislação aplicável, não devam ser remuneradas;</li>
            <li>Imposto sobre o Rendimento do Trabalho (IRT) e contribuições para a Segurança Social, nos termos e de acordo com a legislação aplicável;</li>
            <li>Quaisquer outros descontos permitidos por lei (se aplicáveis).</li>
        </ol>

        <p className="font-bold">Cláusula 5ª (Horário de Trabalho)</p>
        <ol className="list-decimal list-inside mb-4 pl-4"><li>O período normal de trabalho é de 8 (oito) horas diárias e 44 (quarenta e quatro) horas semanais, sendo o horário de trabalho o estabelecido pelo Cliente.</li></ol>

        <p className="font-bold">Cláusula 6ª (Higiene e Segurança)</p>
        <ol className="list-decimal list-inside mb-4 pl-4"><li>O posto de trabalho obedece às condições de segurança, saúde e higiene no trabalho legalmente exigidas.</li></ol>
        
        <div className="break-after-page"></div>

        <p className="font-bold">Cláusula 7ª (Obrigações)</p>
         <p className="mb-2">Pelo presente contrato o TRABALHADOR obriga-se especialmente a:</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Observar o disposto na legislação laboral em vigor, nas normas regulamentares vigentes na empresa, bem como as regras deontológicas próprias do cargo, no que respeita ao SIGILO PROFISSIONAL.</li>
            <li>Contribuir para a criação de um bom clima de trabalho;</li>
            <li>Aplicar-se nos cursos e ações de formação e aperfeiçoamento promovidos pela Empresa;</li>
        </ol>

         <p className="font-bold">Cláusula 8ª (Condições de Prestação de Trabalho)</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Durante a vigência do presente Contrato, o TRABALHADOR prestará o seu trabalho sob a autoridade do Cliente, cabendo a este exercer sobre o TRABALHADOR os poderes de direção e de organização do trabalho, ficando a cargo do EMPREGADOR o poder disciplinar sobre o Trabalhador.</li>
            <li>O TRABALHADOR deverá prestar o seu trabalho de acordo com as instruções do Cliente e respetivos procedimentos (incluindo, sem se limitar, procedimentos sobre segurança, saúde e higiene no trabalho) e políticas em vigor, bem como respeitar todas as leis e regulamentos aplicáveis.</li>
            <li>O TRABALHADOR ficará sujeito ao regime de prestação de trabalho determinado pelo Cliente, nomeadamente, no que toca ao seguinte: a. Transferência de local de trabalho. Dentro dos limites da lei, o Cliente poderá transferir o TRABALHADOR para qualquer outro local onde exerça atividade em Angola. b. Variações ao horário de trabalho. O TRABALHADOR está sujeito às variações de horário de trabalho resultantes do regime de funcionamento do centro de trabalho onde exerça as suas funções, e não poderá recusar-se a prestar trabalho extraordinário quando o recurso ao mesmo esteja legalmente justificado, nomeadamente sempre que necessidades urgentes e/ou imperiosas de produção e serviço assim o exijam e, das mesmas merecerá remuneração conforme a LGT. c. Ferramentas de trabalho. O Cliente fornecerá ao TRABALHADOR toda a informação, material e equipamentos necessários ao exercício das respetivas funções. Na data de cessação do Contrato, o TRABALHADOR deverá devolver ao Cliente todas as ferramentas de trabalho e outros materiais, documentos, etc. que recebeu do Cliente ou que obteve, preparou ou ajudou a preparar, no decurso do desempenho das suas funções (incluindo cópias).</li>
        </ol>
        
        <p className="font-bold">Cláusula 9ª (Férias)</p>
        <ol className="list-decimal list-inside mb-4 pl-4"><li>O TRABALHADOR tem direito a férias nos termos previstos na LGT.</li></ol>

        <p className="font-bold">Cláusula 10ª (Exclusividade)</p>
        <ol className="list-decimal list-inside mb-4 pl-4"><li>Durante a vigência do presente contrato é vedado ao TRABALHADOR celebrar contratos de trabalho, de prestação de serviço ou, de qualquer forma, relacionar-se profissionalmente com outras entidades sem autorização prévia do EMPREGADOR.</li></ol>

        <p className="font-bold">Cláusula 11ª (Obrigações das Partes)</p>
        <p className="mb-2 font-semibold">EMPREGADOR:</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Pagar pontualmente a remuneração devida ao TRABALHADOR, nos termos aqui estabelecidos;</li>
            <li>Inscrever e manter inscrito o TRABALHADOR junto ao Instituto Nacional de Segurança Social (INSS), e proceder à retenção e liquidação das respetivas contribuições para a segurança social nos termos da legislação aplicável;</li>
            <li>Proceder ao registo do TRABALHADOR como contribuinte fiscal (caso este não esteja registado) junto à Administração Geral Tributária (AGT), e proceder à retenção e liquidação dos montantes devidos a título de IRT nos termos da legislação aplicável;</li>
            <li>Contratar um seguro contra acidentes de trabalho e doenças profissionais a favor do TRABALHADOR, incluindo cobertura dos riscos inerentes às funções a serem exercidas pelo TRABALHADOR ao abrigo deste Contrato;</li>
        </ol>

        <p className="mb-2 font-semibold">O TRABALHADOR:</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Desempenhar as suas funções com a diligência, zelo, prudência e dedicação exigíveis quer pela legislação vigente quer pelos regulamentos internos do Cliente;</li>
            <li>Comparecer ao serviço de forma assídua, pontual e asseada;</li>
            <li>Guardar lealdade ao EMPREGADOR e ao Cliente;</li>
            <li>Durante a vigência deste Contrato, manter uma relação jurídico-laboral única e exclusiva com o EMPREGADOR, abstendo-se de prestar trabalho, seja a que título for, a terceiros (com exceção do Cliente);</li>
            <li>Cumprir e respeitar todos os regulamentos, diretivas, planos de trabalho, ordens e instruções, escritas ou verbais, provenientes dos representantes do Cliente e superiores hierárquicos perante os quais responde no âmbito da organização do Cliente;</li>
            <li>Respeitar escrupulosamente os procedimentos e as regras de funcionamento em prática no seio da organização do Cliente, designadamente as regras e procedimentos técnicos e de segurança, higiene e saúde no trabalho, bem como, aqueles que digam diretamente respeito à conduta a observar nas instalações onde o trabalho é prestado, nomeadamente, manuseamento de equipamentos técnicos e de outros mecanismos;</li>
            <li>Responsabilizar-se pela custódia e adequada utilização e conservação de todos os bens e valores que, no âmbito deste Contrato, sejam por ele recebidos ou manuseados ou, por qualquer outra forma, se encontrem à sua guarda ou encargo, responsabilizando-se, nos termos gerais, pelo ressarcimento de quaisquer prejuízos que venha a, direta ou indiretamente, causar ao EMPREGADOR e/ou ao Cliente em resultado de um desempenho negligente das suas funções, nomeadamente, extravio dos referidos bens e valores ou sua danificação, sem prejuízo de um eventual procedimento disciplinar ou criminal;</li>
            <li>Abster-se de ter uma conduta que possa prejudicar o nome e a imagem do EMPREGADOR ou do Cliente e/ou dos seus respetivos representantes;</li>
            <li>Dedicar o seu tempo de trabalho e esforços aos interesses do Cliente;</li>
            <li>Cumprir todas as normas, diretivas e instruções que lhe forem comunicadas pelo Cliente e seus representantes;</li>
            <li>Abster-se da posse e uso de armas de fogo, explosivos e outras armas brancas no local de trabalho;</li>
            <li>Abster-se do uso de drogas ilegais ou ilícitas, bebidas intoxicantes (álcool) e outras drogas no local de trabalho e quaisquer outros centros de trabalho onde o TRABALHADOR exerça as suas funções.</li>
        </ol>

        <p className="font-bold">Cláusula 12ª (Dever de Confidencialidade e Não Divulgação de Informação)</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>O TRABALHADOR obriga-se a manter estritamente confidencial e não divulgar a terceiros toda a informação de que tenha ou venha a ter conhecimento, enquanto estiver ao serviço do Cliente, relativamente:</li>
            <li>As atividades do EMPREGADOR e do Cliente, seus respetivos clientes, parceiros e/ou fornecedores, incluindo, sem se limitar, qualquer documentação ou know-how técnico ou comercial inerente às referidas atividades;</li>
            <li>Ao EMPREGADOR e ao Cliente, suas respetivas afiliadas e subsidiárias, seus respetivos trabalhadores, colaboradores ou outros intervenientes, designadamente no que se refere aos seus respetivos modelos e estratégias de negócio, técnicas de marketing, promoção e venda, aos métodos de trabalho ou às margens financeiras e outros indicadores económicos e comerciais.</li>
            <li>A obrigação de confidencialidade prevista nesta cláusula vigora durante todo o período de duração do presente Contrato e permanecerá válida e exequível mesmo após a cessação da relação jurídico-laboral entre as Partes a qualquer título.</li>
            <li>Em caso de violação do disposto na presente cláusula, além de ser justa-causa para despedimento, o TRABALHADOR incorrerá na obrigação de indemnizar o EMPREGADOR e/ou o Cliente (conforme o caso) pelos danos causados, nos termos gerais da lei.</li>
        </ol>

        <div className="break-after-page"></div>

        <p className="font-bold">Cláusula 13ª (Declarações e Garantias)</p>
        <p className="mb-2">O TRABALHADOR declara e garante ao EMPREGADOR, que:</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Não está vinculado a nenhuma outra empresa na data de início do presente Contrato, seja através de uma relação jurídico-laboral seja através de uma prestação de serviços ou qualquer outro vínculo legal; e</li>
            <li>Não está sujeito a qualquer cláusula de não concorrência referente a vínculo contratual anterior, que o impeça sob qualquer meio de proceder à prestação do trabalho ao Cliente no âmbito deste Contrato.</li>
            <li>A inexatidão, omissão ou erro nas declarações e garantias prestadas pelo TRABALHADOR, confere ao EMPREGADOR justa causa para despedimento, caso tal inexatidão, omissão ou erro resulte de dolo ou negligência grosseira por parte do TRABALHADOR.</li>
        </ol>

        <p className="font-bold">Cláusula 14ª (Modificações)</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Além das circunstâncias previstas na LGT, poderá haver modificação dos direitos económicos respeitantes ao Trabalhador, caso a entidade empregadora tenha razões economicamente justificáveis e comprovadas.</li>
            <li>As modificações serão apenas por documento escrito, assinado por ambas as Partes, com expressa menção de cada uma das cláusulas alteradas, aditadas ou eliminadas, bem como, da nova redação que as mesmas, eventualmente, venham a ter.</li>
            <li>No momento de celebração do presente contrato, o TRABALHADOR tomou conhecimento do horário de trabalho, Regulamentos Internos e demais normas e procedimentos de trabalho em vigor na empresa.</li>
            <li>O Contrato apenas poderá ser modificado nas condições previstas na L.G.T., ou por mútuo acordo das partes.</li>
        </ol>

        <p className="font-bold">Cláusula 15ª (Conflitos)</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>Quaisquer conflitos entre o TRABALHADOR e o EMPREGADOR por motivos relacionados com a constituição, manutenção, suspensão e extinção da relação jurídico-laboral entre si, ou com a execução do Contrato e a satisfação dos direitos e cumprimento dos deveres das Partes decorrentes do mesmo, bem como o recurso de medidas disciplinares aplicadas ao TRABALHADOR, serão resolvidos, em primeira instância, amigavelmente entre as Partes.</li>
            <li>Na falta de resolução amigável no prazo de 30 (trinta) dias contados da data da notificação de qualquer Parte que dá conta do conflito em questão, os conflitos laborais decorrentes deste Contrato poderão ser resolvidos por via de mediação, conciliação e arbitragem, de acordo e nos termos das disposições aplicáveis do Código do Processo do Trabalho.</li>
            <li>No caso de o conflito não ser definitivamente resolvido por nenhum dos mecanismos extrajudiciais anteriormente referidos, o conflito será submetido à resolução por via judicial, nos termos e condições estabelecidas no Código do Processo do Trabalho.</li>
            <li>Para resolução de conflitos decorrentes deste contrato de trabalho, as partes escolhem como exclusivamente competente o Tribunal da comarca de Luanda.</li>
        </ol>
        
        <p className="font-bold">Cláusula 16ª (Disposições Gerais)</p>
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
            <li>O não exercício por qualquer uma das Partes de quaisquer direitos, poderes ou privilégios concedidos no âmbito deste Contrato, não implica a sua renúncia, total ou parcial, definitiva ou temporária.</li>
            <li>Na medida do que for permitido por lei, a renúncia a qualquer disposição deste Contrato e a aceitação de qualquer violação do mesmo serão apenas válidas caso sejam expressas, por escrito, pela Parte que delas puder dispor.</li>
            <li>A ilegalidade ou ineficácia de qualquer disposição do presente Contrato não afetará a validade e eficácia das restantes disposições do Contrato.</li>
            <li>As obrigações e direitos das Partes que, pela sua natureza, não se esgotem com o presente Contrato, permanecerão em vigor e vincularão as Partes nos seus precisos termos, mesmo após a cessação do Contrato.</li>
        </ol>

        <p className="mt-6 mb-6">POR ESTAREM DE ACORDO, as Partes assinam o presente Contrato em (02) exemplares, de igual teor e valor jurídico, sendo um para o EMPREGADOR, e um para o TRABALHADOR.</p>
        
        <p className="mb-12">Luanda, aos {formattedDate}.</p>

        <div className="flex justify-around items-end">
            <div className="text-center">
                <p className="font-bold">O EMPREGADOR</p>
                <div className="border-b-2 border-black mt-16 mb-1 w-64"></div>
                <p>{contractData.companySignatory}</p>
                <p>(Direcção Geral)</p>
            </div>
            <div className="text-center">
                <p className="font-bold">O TRABALHADOR</p>
                <div className="border-b-2 border-black mt-16 mb-1 w-64"></div>
                <p>{contractData.name}</p>
            </div>
        </div>

      </div>
    </div>
  );
}
