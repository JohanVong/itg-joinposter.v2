/**
 * Отображает и создает новых клиентов
 * **/
export default class OrderView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            bonusCards: [],
            businessLogin: '',
            businessPassword: '',
            currentCardID: 0,
            notice: '',
            stage: 1,
        };
    }

    updateInput = (e) => {
        let { id, value } = e.target;
        this.setState({ [id]: value });
    };

    resetInput = () => {
        this.setState({ businessLogin: '', businessPassword: '', clientPhone: '' });
    };

    testConnection = (evt) => {
        const { language, engVersionSyntax } = this.props;
        let resData, token, promiseJson;

        evt.preventDefault();
        this.setState({ stage: -1, notice: '' });
        
        const requestBody = { 
            Email: evt.target['businessLogin'].value,
            Password: evt.target['businessPassword'].value 
        }

        console.log(language.toUpperCase());

        let request = fetch(this.props.tuvisUrl + '/user/auth/login', {
            headers: {
                'Content-Type': 'application/json',
                'X-Locale': (language === 'en' ? 'EN' : 'RU')
            },
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        request
            .then(promise => {
                promiseJson = promise.json();
                token = promise.headers.get('x-token');
                localStorage.setItem('X-Token', token);

                promiseJson
                    .then(data => {
                        if (data.status === "true") {
                            this.resetInput();
                            this.setState({ stage: 0 });
            
                            Poster.makeRequest(this.props.tuvisUrl + '/card', {
                                headers: [
                                    'Content-Type: application/json',
                                    'X-Token: ' + token,
                                    'X-Locale: ' + (language === 'en' ? 'EN' : 'RU')
                                ],
                                method: 'get',
                                timeout: 15000
                            }, (answer) => {
                                resData = JSON.parse(answer.result);
                                if (resData.status === "true") {
                                    this.setState({ stage: 2, bonusCards: resData.data, currentCardID: resData.data[0].ID });
                                } else {
                                    this.setState({ stage: 1, notice: resData.message });
                                }
                            });
                        } else {
                            this.setState({ stage: 1, notice: data.message });
                        }
                    })
                    .catch(err => {
                        this.setState({ stage: 1 });
                    });
            })
            .catch(err => {
                console.log('Ошибка запроса: [test_conn]');
                this.setState({ stage: 1, notice: language === engVersionSyntax ? 'Authorization request failed' : 'Ошибка запроса авторизации' });
            });
    };

    savePreferences = (evt) => {
        let { currentCardID } = this.state;
        evt.preventDefault();
        const cardID = currentCardID;
        localStorage.setItem('cardID', cardID)
        this.setState({ stage: 3 });
    };

    render() {
        let { businessLogin, businessPassword, currentCardID, stage, bonusCards, notice } = this.state;
        let { language, engVersionSyntax, isActive, toggleActivity } = this.props;

        // Не используемые для операций переменные
        // нужные для того, чтобы контролировать состояние
        let token = localStorage.getItem('X-Token');
        let cardID = localStorage.getItem('cardID');

        // Отображаем элементы в зависимости от того, какие данные имеем.
        if (stage === 2 && bonusCards) {
            return (
                <form onSubmit={this.savePreferences}>
                    {/** using hidden input for IOS 9 input focus and onChange fix **/}
                    <input type="hidden"/>

                    <div className="row">
                        <div className="col-xs-12">
                            <div className="input-group-lg">
                                <p style={{marginBottom: '1rem'}}>{language === engVersionSyntax ? 'Card to use:' : 'Выберите карту:'}</p>
                                <select className="col-xs-12" style={{marginBottom: '1rem'}} id="currentCardID" value={currentCardID} onChange={this.updateInput}>
                                {
                                    bonusCards.map(card => 
                                        <option value={card.ID} key={card.ID}> {card.Name} </option>
                                    )
                                }                                    
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="footer">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="btn btn-lg btn-success" type="submit">{language === engVersionSyntax ? 'Select' : 'Выбрать'}</button>
                            </div>
                        </div>
                    </div>
                </form>
            );
        } else if (stage === 3 || token, cardID) {
            return (
                <div>
                    {/** using hidden input for IOS 9 input focus and onChange fix **/}
                    <input type="hidden"/>

                    <div className="row">
                        <div className="col-xs-12">
                            <div className="input-group-lg">
                                <div style={{textAlign: 'center', color: isActive ? 'black': 'grey'}}>
                                    <p>{language === engVersionSyntax && isActive ? 'Application is active' : language === engVersionSyntax && !isActive ? 'Application is inactive' : language !== engVersionSyntax && isActive ? 'Приложение активно' : language !== engVersionSyntax && !isActive ? 'Приложение не активно' : 'Status unknown'}</p> 
                                    <p>{language === engVersionSyntax ? 'Click the icon to change' : 'Нажмите на иконку, чтобы изменить'}</p>                                  
                                    <button style={{outline: "none", marginTop: "20px"}} className={isActive ? "btn btn-lg btn-success" : "btn btn-lg btn-danger"} onClick={toggleActivity}>TuviS</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="footer">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="btn btn-lg btn-primary" type="submit" onClick={Poster.interface.closePopup}>{language === engVersionSyntax ? 'Close' : 'Закрыть'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else if (stage === -1) {
            return (
                <div style={{textAlign: 'center', color: 'darkblue'}}>
                    <h2>{language === engVersionSyntax ? 'Authenticating in TuviS...' : 'Авторизация в Tuvis...'}</h2>
                </div>
            );
        } else if (stage === 0) {
            return (
                <div style={{textAlign: 'center', color: 'darkblue'}}>
                    <h2>{language === engVersionSyntax ? 'Loading cards...' : 'Загрузка карт...'}</h2>
                </div>
            );
        } else if (stage === 1 || token.length === 0) {
            return (
                <form onSubmit={this.testConnection}>
                    {/** using hidden input for IOS 9 input focus and onChange fix **/}
                    <input type="hidden"/>

                    <div className="row">
                        <div className="col-xs-12">
                            <div className="input-group-lg">
                                <input
                                    className="form-control" style={{marginBottom: '1rem'}} type="text" placeholder={language === engVersionSyntax ? 'TuviS work-point login' : "Логин рабочей точки TuviS"}
                                    id="businessLogin" onChange={this.updateInput} value={businessLogin}
                                />
                                <input
                                    className="form-control" style={{marginBottom: '1rem'}} type="password" placeholder={language === engVersionSyntax ? 'TuviS work-point password' : "Пароль рабочей точки TuviS"}
                                    id="businessPassword" onChange={this.updateInput} value={businessPassword}
                                />
                                <p style={{color: 'orangered', marginTop: 10}}>{notice}</p>
                                
                                <button className="btn btn-lg btn-warning col-xs-12" type="submit">{language === engVersionSyntax ? 'Test connection' : 'Тест соединения'}</button>
                            </div>
                        </div>
                    </div>

                    <div className="footer">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="btn btn-lg btn-success" disabled type="button">{language === engVersionSyntax ? 'Select' : 'Выбрать'}</button>
                            </div>
                        </div>
                    </div>
                </form>
            );
        } else {
            Poster.interface.closePopup();
            return null
        }
    }
}
