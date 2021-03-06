export default class AfterView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            result: 0,
            notice: ''
        };
    }

    componentDidMount() {
        this.giveBonus();
    }

    giveBonus = () => {
        const { language, tuvisClientNumber, currentOrderCost } = this.props;
        
        Poster.orders.getActive()
        .then((object) => {
            if (object.order.platformDiscount > 0) {
                return null
            }

            const totalSum = currentOrderCost;
            const reqBody = {
                AmountFull: totalSum,
                CardID: 0,
                ClientPhone: tuvisClientNumber,
                OperationType: "sale",
                Points: 0,
                sale: []
            }
            let resData;
            
            Poster.makeRequest(this.props.tuvisUrl + `/card/card-info-by-card-and-client-phone?card_id=0&client_phone=${tuvisClientNumber}`, {
                headers: [
                    'Content-Type: application/json',
                    `X-Token-Api: ${Poster.settings.extras["tuvisApiToken"]}`,
                    'X-Locale: ' + (language === 'en' ? 'EN' : 'RU')
                ],
                method: 'get',
                timeout: 15000
            }, (answer) => {
                if (answer && Number(answer.code) === 200) {
                    resData = JSON.parse(answer.result);
                    if (resData.status === 'false') {
                        this.setState({ result: -1, notice: resData.message });
                    } else {
                        let request = fetch(this.props.tuvisUrl + '/card/transaction/link', {
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Token-Api': Poster.settings.extras["tuvisApiToken"],
                                'X-Locale': (language === 'en' ? 'EN' : 'RU')
                            },
                            method: 'POST',
                            body: JSON.stringify(reqBody)
                        });
    
                        request
                            .then(response => response.json())
                            .then(data => {
                                if (data.status === "false") {
                                    console.log(data.message);
                                    this.setState({ result: -1, notice: data.message });
                                } else {
                                    console.log(data.message);
                                    this.setState({ result: 1 });
                                    setTimeout(() => {
                                        Poster.interface.closePopup();
                                    }, 2000)
                                }
                            })
                            .catch(err => {
                                console.log('???????????? ??????????????: [add_bonus-2]');
                                this.setState({ result: -1 });
                            })              
                    }
                } else {
                    resData = JSON.parse(answer.result);
                    console.log('???????????? ??????????????: [add_bonus-1]');
                    this.setState({ result: -1, notice: resData.message });
                }
            });
        })
    };

    render() {
        let { result, notice } = this.state;
        const { language, engVersionSyntax } = this.props;

        if (result === 1) {
            return (
                <div className="row">
                    <div className="col-xs-12">
                        <p style={{textAlign: 'center', color: 'green', fontSize: 20}}>{language === engVersionSyntax ? 'Bonuses accrued!' : '???????????? ??????????????????!'}</p>
                    </div>
                </div>
            )
        } else if (result === -1) {
            return (
                <div className="row">
                    <div className="col-xs-12">
                        <p style={{textAlign: 'center', color: 'red', fontSize: 20}}>{language === engVersionSyntax ? "Bonuses accrual failed" : '???????????? ???? ??????????????????'}</p>
                        <p style={{textAlign: 'center', color: 'orangered', marginTop: 10}}>{notice}</p>
                        <button 
                            type="button" className="btn btn-lg btn-danger col-xs-12" 
                            style={{textAlign: 'center', marginTop: 20}}
                            onClick={Poster.interface.closePopup}>{language === engVersionSyntax ? 'Close' : '??????????????'}
                        </button>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="row">
                    <div className="col-xs-12">
                        <p style={{textAlign: 'center', color: 'darkblue', fontSize: 20}}>{language === engVersionSyntax ? 'Accrual in progress...' : '?????????????????? ????????????...'}</p>
                    </div>
                </div>
            )
        }
    }
}
