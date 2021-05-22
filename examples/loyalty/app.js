import ClientView from './client';
import BonusView from './bonus';
import AfterView from './after';

/**
 * Отвечает за общую логику приложения,
 * обрабатывает ивенты Poster и отображает разные компоненты
 */
export default class LoyaltyApp extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isNeedToBeReloaded: false,
            isActive: true,
            isSkipped: false,
            tuvisClientNumber: null,
            currentOrderCost: null,
            currentOrderDiscount: null,
            engVersionSyntax: 'en',
            language: Poster.settings.lang,
            place: '', // Доступные варианты: order | beforeOrderClose | afterOrderClose
            tuvisUrl: 'https://api.tuvis.world/api/app-manage-staff',
            uaVersionSyntax: 'ua',
        }
    }

    componentDidMount() {
        // Показываем кнопки в интерфейсе Poster
        Poster.interface.showApplicationIconAt({ order: 'TuviS' });

        // Подписываемся на ивенты Poster
        Poster.on('applicationIconClicked', this.showPopup);
        Poster.on('beforeOrderClose', (data, next) => {
            let { isActive, isNeedToBeReloaded } = this.state;

            Poster.orders.getActive()
            .then((object) => {
                let token = Poster.settings.extras["tuvisApiToken"];

                this.setState({ currentOrderCost: object.order.total, currentOrderDiscount: object.order.platformDiscount });
            
                if (token === '' || token === null || token === undefined || !isActive || object.order.platformDiscount > 0 || isNeedToBeReloaded === true) {
                    next();
                } else {
                    // Сохранили callback чтобы закрыть заказ
                    this.skipToFalse();
                    this.next = next;
                    this.showPopup({ place: 'beforeOrderClose' });
                }
            })
        });
        Poster.on('afterOrderClose', (data) => {
            let { isActive, currentOrderDiscount, isNeedToBeReloaded, isSkipped } = this.state;
            
            Poster.orders.getActive()
            .then((object) => {
                let token = Poster.settings.extras["tuvisApiToken"];
            
                if (token === '' || token === null || token === undefined || !isActive || isSkipped || object.order.platformDiscount > 0 || currentOrderDiscount > 0 || isNeedToBeReloaded === true) {
                    this.skipToFalse();
                } else {
                    this.showPopup({ place: 'afterOrderClose' });
                }
            })

            this.setState({})
        });
    }

    skipToTrue = () => {
        Poster.interface.closePopup();
        this.setState({ isSkipped: true });
        this.next();
    }
    skipToFalse = () => {
        this.setState({ isSkipped: false });
    }

    toggleActivity = () => {
        let {isActive} = this.state;

        this.setState({ isActive: !isActive });
    }

    setCurrentOrderDiscount = (number) => {
        this.setState({ currentOrderDiscount: number });
    }

    setTuvisClientNumber = (tuvisClientNumber) => {
        this.setState({ tuvisClientNumber: tuvisClientNumber });
    }

    setReloadNecessity = () => {
        this.setState({ isNeedToBeReloaded: true });
    }

    /**
     * Списывает бонусы
     * @param bonus
     */
    withdrawBonus = (bonus) => {
        Poster.orders.getActive()
        .then((object) => {
            bonus = parseFloat(bonus);

            Poster.orders.setOrderBonus(object.order.id, bonus);
            Poster.interface.closePopup();
    
            // Продолжаем стандартный флоу закрытия заказа Poster (показывем окно заказа)
            this.next();
        })
    }

    /**
     * Показывает интерфейс в зависимости от места в котором интерфейс вызывают
     * @param data
     */
    showPopup = (data) => {
        if (data.place === 'order') {
            this.setState({ place: 'order' });
            Poster.interface.popup({ width: 500, height: 400, title: 'TuviS' }); 
        }

        if (data.place === 'beforeOrderClose') {
            this.setState({ place: 'beforeOrderClose' });
            Poster.interface.popup({ width: 500, height: 400, title: 'TuviS' });
        }

        if (data.place === 'afterOrderClose') {
            this.setState({ place: 'afterOrderClose' });
            Poster.interface.popup({ width: 500, height: 400, title: 'TuviS' });
        }
    };

    render() {
        const { place, language, engVersionSyntax, uaVersionSyntax, tuvisClientNumber, isActive, tuvisUrl, currentOrderCost } = this.state;

        // В зависимости от места в котором вызвали окно интеграции отображаем разные окна

        if (place === '') {
            Poster.interface.closePopup();
            return null
        }

        // Окно заказа
        if (place === 'order') {
            return (
                <ClientView
                    isActive={isActive}
                    toggleActivity = {this.toggleActivity}
                    setReloadNecessity = {this.setReloadNecessity}
                    tuvisUrl={tuvisUrl}
                    language={language}
                    engVersionSyntax={engVersionSyntax}
                    uaVersionSyntax={uaVersionSyntax}
                />
            );
        }

        // Окно списания бонусов перед закрытием заказа
        if (place === 'beforeOrderClose') {
            return (
                <BonusView
                    tuvisUrl={tuvisUrl}
                    skipToTrue={this.skipToTrue}
                    withdrawBonus={this.withdrawBonus}
                    setCurrentOrderDiscount={this.setCurrentOrderDiscount}
                    setTuvisClientNumber={this.setTuvisClientNumber}
                    language={language}
                    engVersionSyntax={engVersionSyntax}
                    uaVersionSyntax={uaVersionSyntax}
                />
            );
        }

        // Окно списания бонусов после закрытия заказа
        if (place === 'afterOrderClose') {
            return (
                <AfterView
                    toggleSkip={this.toggleSkip}
                    currentOrderCost={currentOrderCost}
                    tuvisUrl={tuvisUrl}
                    tuvisClientNumber={tuvisClientNumber}
                    language={language}
                    engVersionSyntax={engVersionSyntax}
                />
            );
        }

        return (<div />);
    }
}
