/**
 * Окно подтверждения списания бонусов
 * В данном приложении, бонусы внутри модели клиента joinposter, никак 
 * не используются. Вместо этого они находятся в локальном хранилище
 * и проверяются на предмет подделки. 
 */

const initialState = {
    maxToSpend: '',
    availableToSpend: '',
    bonusToUse: '',
    clientPhone: '',
    currentClientTuvisBonuses: null,
    currentClientTuvisLimit: null,
    notice: '',
    stage: 1,
};

export default class BonusView extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            maxToSpend: '',
            availableToSpend: '',
            bonusToUse: '',
            clientPhone: '',
            currentClientTuvisBonuses: null,
            currentClientTuvisLimit: null,
            notice: '',
            stage: 1,
        };
    }

    updateInput = (e) => {
        let {id, value} = e.target;
        this.setState({[id]: value});
    };

    resetInput = () => {
        this.setState({ clientPhone: '' });
    };

    getTuvisClientInfo = (evt) => {
        const { language, engVersionSyntax, setTuvisClientNumber, dropCredentials, tuvisTokenErrorMessages } = this.props;
        let mobilePhone = evt.target['clientPhone'].value;
        let resData;

        evt.preventDefault();

        Poster.orders.getActive()
        .then((object) => {
            Poster.makeRequest(this.props.tuvisUrl + `/card/card-info-by-card-and-client-phone?card_id=${localStorage.getItem('cardID')}&client_phone=${mobilePhone}`, {
                headers: [
                    'Content-Type: application/json',
                    `X-Token: ${localStorage.getItem('X-Token')}`,
                    'X-Locale: ' + (language === 'en' ? 'EN' : 'RU')
                ],
                method: 'get',
                timeout: 15000
            }, (answer) => {
                if (answer && Number(answer.code) === 200) {
                    resData = JSON.parse(answer.result);
                    // console.log(resData);
                    if (resData.status === 'false') {
                        this.setState({ notice: resData.message });
                    } else {
                        setTuvisClientNumber(mobilePhone);
                        this.setState({
                            stage: 2,
                            currentClientTuvisLimit: resData.data.CardCondition.PointsPaymentPercent,
                            currentClientTuvisBonuses: resData.data.TotalPointsAvailable, 
                            maxToSpend: object.order.total * resData.data.CardCondition.PointsPaymentPercent * 0.01,
                            bonusToUse: (resData.data.TotalPointsAvailable > object.order.total * resData.data.CardCondition.PointsPaymentPercent * 0.01) ? Math.floor(object.order.total * resData.data.CardCondition.PointsPaymentPercent * 0.01) : Math.floor(resData.data.TotalPointsAvailable),
                            availableToSpend: (resData.data.TotalPointsAvailable > object.order.total * resData.data.CardCondition.PointsPaymentPercent * 0.01) ? Math.floor(object.order.total * resData.data.CardCondition.PointsPaymentPercent * 0.01) : Math.floor(resData.data.TotalPointsAvailable) 
                        })
                    }
                } else {
                    console.log('Ошибка запроса: [add_client]');
                    resData = JSON.parse(answer.result);
                    this.setState({ notice: resData.message });
                    tuvisTokenErrorMessages.forEach(errMsg => {
                        if (errMsg === resData.message) {
                            dropCredentials();
                        }
                    })
                }
            });        
        })

        if (mobilePhone === undefined || mobilePhone.trim() === '' || mobilePhone === null) {
            return this.setState({ notice: language === engVersionSyntax ? 'Enter phone number' : 'Введите номер телефона' });
        } else {
            this.setState({ notice: '' });
        }
    };

    chargeBonus = () => {
        this.setState({ notice: '' });

        const { bonusToUse, currentClientTuvisBonuses, clientPhone } = this.state;
        const { language, engVersionSyntax, dropCredentials, setCurrentOrderDiscount, withdrawBonus } = this.props;

        Poster.orders.getActive()
        .then((object) => {
            const balance = currentClientTuvisBonuses;
            const currentBonusCard = localStorage.getItem('cardID');
            const totalSum = object.order.total;
            const reqBody = {
                AmountFull: totalSum,
                CardID: Number(currentBonusCard),
                ClientPhone: clientPhone,
                OperationType: "sale",
                Points: Number(bonusToUse),
                sale: []
            }
            let resData;
    
            if (Number(bonusToUse) <= 0 || Number(bonusToUse) === '') {
                return null;
            } 
            
            Poster.makeRequest(this.props.tuvisUrl + `/card/card-info-by-card-and-client-phone?card_id=${localStorage.getItem('cardID')}&client_phone=${clientPhone}`, {
                headers: [
                    'Content-Type: application/json',
                    `X-Token: ${localStorage.getItem('X-Token')}`,
                    'X-Locale: ' + (language === 'en' ? 'EN' : 'RU')
                ],
                method: 'get',
                timeout: 15000
            }, (answer) => {
                if (answer && Number(answer.code) === 200) {
                    resData = JSON.parse(answer.result);
                    if (resData.status === 'false') {
                        this.setState({ notice: resData.message});
                    } else {
                        if (Number(bonusToUse) > Number(balance)) {
                            this.setState({ notice: language === engVersionSyntax ? 'Not enough balance' : 'Недостаточно бонусов' });
                        } else {
                            let request = fetch(this.props.tuvisUrl + '/card/transaction/link', {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Token': localStorage.getItem('X-Token'),
                                    'X-Locale': (language === 'en' ? 'EN' : 'RU')
                                },
                                method: 'POST',
                                body: JSON.stringify(reqBody)
                            });
    
                            request
                                .then(response => response.json())
                                .then(data => {
                                    if (data.status === "false") {
                                        this.setState({ notice: data.message });
                                    } else {
                                        console.log(data.message);
                                        withdrawBonus(bonusToUse);
                                        setCurrentOrderDiscount(bonusToUse);
                                        this.setState(initialState);
                                    }
                                })
                                .catch(err => {
                                    console.log(err);
                                    this.setState({ notice: language === engVersionSyntax ? 'Request failed' : 'Ошибка запроса списания' });
                                })
                        }                  
                    }
                } else {
                    this.setState(initialState);
                    dropCredentials();
                }
            });
        })
    };

    chargeBonusZero = () => {
        this.setState({ bonusToUse: '', notice: '' });
        this.props.withdrawBonus(0);
    };

    componentDidMount() {
        Poster.on('afterPopupClosed', () => {
            this.setState(initialState);
        });
    }

    componentWillUnmount() {
        // fix Warning: Can't perform a React state update on an unmounted component
        this.setState = (state,callback) => {
            return;
        };
    }

    render() {
        let { bonusToUse, notice, currentClientTuvisBonuses, availableToSpend, stage, clientPhone } = this.state;
        const { language, engVersionSyntax, uaVersionSyntax } = this.props;


        if (stage === 1) {
            return (
                <form onSubmit={this.getTuvisClientInfo}>
                    {/** using hidden input for IOS 9 input focus and onChange fix **/}
                    <input type="hidden"/>

                    <div className="row">
                        <div className="col-xs-12">
                            <div className="input-group-lg">
                                <input
                                    className="form-control" style={{marginBottom: '1rem'}} type="text" placeholder={language === uaVersionSyntax ? '+380 XX XXX XX XX' : language === engVersionSyntax ? "+1 XXX XXX XX XX" : "+7 XXX XXX XX XX"}
                                    id="clientPhone" onChange={this.updateInput} value={clientPhone}
                                />
                                
                                <p style={{color: 'orangered', marginTop: 10}}>{notice}</p>
                            </div>
                        </div>
                    </div>

                    <div className="footer">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="btn btn-lg btn-success" type="submit">{language === engVersionSyntax ? 'Request balance' : 'Запросить бонусы'}</button>
                            </div>
                        </div>
                    </div>
                </form>
            );
        } else if (stage === 2) {
            return (
                <div>
                    {/** using hidden input for IOS 9 input focus and onChange fix **/}
                    <input type="hidden"/>
    
                    <div className="row">
                        <div className="col-xs-12">
                            <p>{language === engVersionSyntax ? 'Available balance:' : 'Доступно бонусов:'} {currentClientTuvisBonuses || <span style={{color: 'orangered'}}>{language === engVersionSyntax ? 'Not available' : 'Недоступно'}</span>}</p>
                            <p style={{display: currentClientTuvisBonuses ? 'inherit' : 'none'}}>{language === engVersionSyntax ? 'Max balance to spend:' : 'Бонусов к трате (макс.):'} {availableToSpend}</p>
    
                            <label htmlFor="bonusToUse">{language === engVersionSyntax ? 'Spend' : 'Использовать'}</label>
                            <input
                                type="number" placeholder={language === engVersionSyntax ? 'Bonuses to spend' : "Введите кол-во бонусов"} id="bonusToUse" className="form-control"
                                value={bonusToUse} onChange={this.updateInput}
                            />
    
                            <p style={{color: 'orangered', marginTop: 10}}>{notice}</p>
                        </div>
                    </div>
    
                    <div className="footer">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="btn btn-lg btn-success" 
                                    type="button" onClick={this.chargeBonus}>
                                    {language === engVersionSyntax ? 'Use bonuses' : 'Списать бонусы'}
                                </button>
    
                                <button
                                    className="btn btn-lg btn-default" onClick={this.chargeBonusZero}
                                    style={{marginRight: 20}}
                                >
                                    {language === engVersionSyntax ? 'Skip without spending' : 'Продолжить без списания'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }   
    }
}
