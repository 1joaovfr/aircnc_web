import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod'; // 1. Importar o Zod

import api from '../../services/api';
import camera from '../../assets/camera.svg';

import './styles.css';

// 2. Definir o Schema de Validação
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const spotSchema = z.object({
    thumbnail: z
        .instanceof(File, { message: 'A imagem do spot é obrigatória.' })
        .refine((file) => file.size <= MAX_FILE_SIZE, `O tamanho máximo da imagem é 5MB.`)
        .refine(
            (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
            "Apenas os formatos .jpg, .jpeg, .png e .webp são aceitos."
        ).nullable(), // Permite que o estado inicial seja null
    company: z.string().trim().min(1, 'O nome da empresa é obrigatório.'),
    techs: z.string().trim().min(1, 'Informe ao menos uma tecnologia.'),
    price: z.string().refine(val => val === '' || !isNaN(parseFloat(val)), {
        message: 'O valor da diária deve ser um número válido.',
    }),
});


export function New() {
    const [thumbnail, setThumbnail] = useState(null);
    const [company, setCompany] = useState('');
    const [techs, setTechs] = useState('');
    const [price, setPrice] = useState('');
    const [errors, setErrors] = useState({}); // 3. Estado para os erros

    const navigate = useNavigate();

    const preview = useMemo(() => {
        return thumbnail ? URL.createObjectURL(thumbnail) : null;
    }, [thumbnail]);

    async function handleSubmit(event) {
        event.preventDefault();

        // 4. Lógica de Validação
        const formData = { thumbnail, company, techs, price };
        const validation = spotSchema.safeParse(formData);

        if (!validation.success) {
            // Extrai os erros e atualiza o estado
            const fieldErrors = validation.error.flatten().fieldErrors;
            setErrors(fieldErrors);
            return; // Interrompe o envio se houver erros
        }

        // Se a validação passou, limpa os erros e continua
        setErrors({});

        const data = new FormData();
        const user_id = localStorage.getItem('user');

        data.append('thumbnail', thumbnail);
        data.append('company', company);
        data.append('techs', techs);
        data.append('price', price);

        await api.post('/spots', data, {
            headers: { user_id }
        });

        navigate('/dashboard');
    }
    
    // Adicione um estilo simples para as mensagens de erro no seu CSS
    /*
        .error-message {
            color: #e53e3e;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
    */

    return (
        <form onSubmit={handleSubmit}>
            <label
                id="thumbnail"
                style={{ backgroundImage: `url(${preview})` }}
                className={thumbnail ? 'has-thumbnail' : ''}
            >
                <input type="file"
                    onChange={event => setThumbnail(event.target.files[0])} />
                <img src={camera} alt="Select img" />
            </label>
            {/* 5. Exibir erro do thumbnail */}
            {errors.thumbnail && <span className="error-message">{errors.thumbnail[0]}</span>}

            <label htmlFor="company">*EMPRESA</label>
            <input type="text"
                id='company'
                placeholder='Sua empresa incrível'
                value={company}
                onChange={event => setCompany(event.target.value)} />
            {/* 5. Exibir erro da company */}
            {errors.company && <span className="error-message">{errors.company[0]}</span>}

            <label htmlFor="techs">*TECNOLOGIAS (separadas por vírgula)</label>
            <input type="text"
                id='techs'
                placeholder='Quais tecnologias usam?'
                value={techs}
                onChange={event => setTechs(event.target.value)}
            />
            {/* 5. Exibir erro de techs */}
            {errors.techs && <span className="error-message">{errors.techs[0]}</span>}


            <label htmlFor="price">*VALOR DA DIÁRIA
                (em branco para GRATUITO) </label>
            <input type="text"
                id='price'
                placeholder='Valor cobrado por dia'
                value={price}
                onChange={event => setPrice(event.target.value)} />
            {/* 5. Exibir erro de price */}
            {errors.price && <span className="error-message">{errors.price[0]}</span>}

            <button type='submit' className='btn'>Cadastrar</button>
        </form>
    )
}